/** Small numeric helpers for the simulation. Pure functions, no allocation-heavy tricks. */

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Cubic Hermite interpolation on one segment [x0, x1] with end slopes m0, m1 (per unit x). */
export function hermite(
  x: number,
  x0: number,
  y0: number,
  m0: number,
  x1: number,
  y1: number,
  m1: number,
): number {
  const h = x1 - x0;
  const t = (x - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * m0 +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * m1
  );
}

/**
 * Limits a segment's end slopes so the Hermite curve between them is monotone
 * (Fritsch and Carlson, 1980). Returns the adjusted [m0, m1].
 */
export function monotoneSlopes(
  x0: number,
  y0: number,
  m0: number,
  x1: number,
  y1: number,
  m1: number,
): [number, number] {
  const delta = (y1 - y0) / (x1 - x0);
  if (delta === 0) return [0, 0];
  let a = m0 / delta;
  let b = m1 / delta;
  if (a < 0) a = 0;
  if (b < 0) b = 0;
  const s = a * a + b * b;
  if (s > 9) {
    const tau = 3 / Math.sqrt(s);
    a *= tau;
    b *= tau;
  }
  return [a * delta, b * delta];
}

/**
 * Monotone piecewise-cubic interpolant through (xs, ys) (PCHIP, Fritsch-Carlson
 * slopes with shape-preserving ends). It never overshoots the data, so a
 * published curve's peak stays the peak.
 */
export function pchip(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  if (n < 2 || ys.length !== n) throw new Error('pchip needs at least two matching points.');
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const hi = (xs[i + 1] ?? 0) - (xs[i] ?? 0);
    if (!(hi > 0)) throw new Error('pchip needs strictly rising x.');
    h.push(hi);
    d.push(((ys[i + 1] ?? 0) - (ys[i] ?? 0)) / hi);
  }
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const d0 = d[i - 1] ?? 0;
    const d1 = d[i] ?? 0;
    if (d0 === 0 || d1 === 0 || Math.sign(d0) !== Math.sign(d1)) continue;
    const h0 = h[i - 1] ?? 1;
    const h1 = h[i] ?? 1;
    const w1 = 2 * h1 + h0;
    const w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
  }
  const endSlope = (h0: number, h1: number, d0: number, d1: number): number => {
    let s = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (Math.sign(s) !== Math.sign(d0)) s = 0;
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > Math.abs(3 * d0)) s = 3 * d0;
    return s;
  };
  if (n === 2) {
    m[0] = d[0] ?? 0;
    m[1] = d[0] ?? 0;
  } else {
    m[0] = endSlope(h[0] ?? 1, h[1] ?? 1, d[0] ?? 0, d[1] ?? 0);
    m[n - 1] = endSlope(h[n - 2] ?? 1, h[n - 3] ?? 1, d[n - 2] ?? 0, d[n - 3] ?? 0);
  }
  return (x: number) => {
    const first = xs[0] ?? 0;
    const last = xs[n - 1] ?? 0;
    if (x <= first) return ys[0] ?? 0;
    if (x >= last) return ys[n - 1] ?? 0;
    let i = 0;
    while (i < n - 2 && x > (xs[i + 1] ?? 0)) i++;
    return hermite(
      x,
      xs[i] ?? 0,
      ys[i] ?? 0,
      m[i] ?? 0,
      xs[i + 1] ?? 0,
      ys[i + 1] ?? 0,
      m[i + 1] ?? 0,
    );
  };
}

/** Linear interpolation in a table with rising xs, held flat outside it. */
export function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (n === 0) throw new Error('Empty table.');
  if (x <= (xs[0] ?? 0)) return ys[0] ?? 0;
  if (x >= (xs[n - 1] ?? 0)) return ys[n - 1] ?? 0;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((xs[mid] ?? 0) <= x) lo = mid;
    else hi = mid;
  }
  const x0 = xs[lo] ?? 0;
  const x1 = xs[hi] ?? 0;
  const y0 = ys[lo] ?? 0;
  const y1 = ys[hi] ?? 0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Finds x in [lo, hi] with f(x) = 0 by bisection, given f(lo) and f(hi) of
 * opposite sign. Returns undefined if they are not. Tolerance is on x.
 */
export function bisect(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tolerance: number,
  maxIterations = 100,
): number | undefined {
  let flo = f(lo);
  const fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (Math.sign(flo) === Math.sign(fhi)) return undefined;
  let a = lo;
  let b = hi;
  for (let i = 0; i < maxIterations && b - a > tolerance; i++) {
    const mid = 0.5 * (a + b);
    const fm = f(mid);
    if (fm === 0) return mid;
    if (Math.sign(fm) === Math.sign(flo)) {
      a = mid;
      flo = fm;
    } else {
      b = mid;
    }
  }
  return 0.5 * (a + b);
}

/** rpm to rad/s. */
export function omega(rpm: number): number {
  return (rpm * 2 * Math.PI) / 60;
}

/** rpm points from `from` to `to` inclusive, every `step`. */
export function rpmGrid(from: number, to: number, step = 100): number[] {
  const out: number[] = [];
  for (let n = from; n <= to + 1e-9; n += step) out.push(n);
  return out;
}
