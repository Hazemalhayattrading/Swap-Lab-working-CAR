import type { ModelConstants, SimVariant } from '../../data/sim-data';
import { hermite, monotoneSlopes, omega, pchip, rpmGrid } from '../math';

/**
 * The stock full-load torque curve the calibration fits the engine to, at the
 * rating's own conditions.
 *
 * - Where the maker published a full curve (Nissan Europe's 350Z sheets), it is
 *   that curve, interpolated without overshoot.
 * - Otherwise it runs through the two published peaks: peak torque with zero
 *   slope, and peak power, where the power curve tops out. Between and beyond
 *   them the shape is a documented assumption (model constants `na-idle-*`,
 *   `power-drop-*`, `turbo-spool-*`), and the uncertainty band widens away from
 *   the published points. Below the spool point of a turbo engine there is no
 *   reference: the turbo model decides the torque there.
 */
export interface ReferenceCurve {
  /** Sweep rpm, every 100, idle to redline. */
  grid: number[];
  /** N·m per grid rpm; NaN where the curve doesn't define it (below a turbo's spool point). */
  torque: number[];
  /** First rpm the curve defines. */
  start: number;
  /** rpm of the maker's published figures: the two peaks, or every curve point. */
  anchors: number[];
  source: 'published-curve' | 'peaks';
}

const SHAPES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

/**
 * Peak torque to peak power. Built as a Hermite curve in "torque x (rpm)^s"
 * space and the first s that keeps torque falling, power rising and neither
 * above its peak is used: s = 0 is a torque-space curve (a flat turbo plateau
 * with a knee at peak power), s = 1 a power-space curve (torque that falls
 * steeply while power still climbs, as on an RB26DETT).
 */
function peakToPeak(nT: number, t: number, nP: number, tP: number): (n: number) => number {
  const wT = omega(nT);
  let best: ((n: number) => number) | undefined;
  let bestScore = Infinity;
  for (const s of SHAPES) {
    const scale = (n: number) => Math.pow(omega(n) / wT, s);
    const qP = tP * scale(nP);
    const m0 = (s * t) / nT;
    const m1 = -(1 - s) * (tP / nP) * scale(nP);
    const [a, b] = monotoneSlopes(nT, t, m0, nP, qP, m1);
    const f = (n: number) => hermite(n, nT, t, a, nP, qP, b) / scale(n);
    let score = 0;
    let prevT = t;
    let prevP = t * omega(nT);
    for (let n = nT + 20; n <= nP + 1e-9; n += 20) {
      const tn = f(n);
      const pn = tn * omega(n);
      if (tn > prevT) score += (tn - prevT) / t;
      if (pn < prevP) score += (prevP - pn) / prevP;
      prevT = tn;
      prevP = pn;
    }
    if (score < bestScore) {
      best = f;
      bestScore = score;
      if (score === 0) break;
    }
  }
  if (!best) throw new Error('no curve shape');
  return best;
}

/** Peak power to the end of the sweep: torque and power both falling. */
function pastPeak(nP: number, tP: number, end: number, powerDrop: number): (n: number) => number {
  if (end - nP < 1) return () => tP;
  const p = tP * omega(nP);
  const x = end / nP - 1;
  const tE = (p * (1 - powerDrop * x)) / omega(end);
  const stationary = -tP / nP;
  const secant = (tE - tP) / (end - nP);
  for (const steepen of [1, 1.25, 1.5, 2, 3]) {
    const mE = Math.min(secant, (-tE / end) * steepen);
    const [a, b] = monotoneSlopes(nP, tP, stationary, end, tE, mE);
    const f = (n: number) => hermite(n, nP, tP, a, end, tE, b);
    let ok = true;
    let prevP = p;
    for (let n = nP + 20; n <= end + 1e-9; n += 20) {
      const pn = f(n) * omega(n);
      if (pn > prevP + 1e-9) ok = false;
      prevP = pn;
    }
    if (ok) return f;
  }
  const [a, b] = monotoneSlopes(nP, tP, stationary, end, tE, secant);
  return (n: number) => hermite(n, nP, tP, a, end, tE, b);
}

/** rpm the sweep ends at: redline, else fuel-cut, else peak power plus a margin. */
export function sweepEnd(variant: SimVariant, k: ModelConstants): number {
  const nP = variant.rating.powerRpm.value;
  const published = variant.redline?.value ?? variant.revLimit?.value;
  const end = published ?? Math.ceil((nP + k['sweep-margin-rpm']) / 100) * 100;
  return Math.max(end, nP);
}

export function referenceCurve(
  variant: SimVariant,
  boosted: boolean,
  k: ModelConstants,
): ReferenceCurve {
  const idle = k['idle-rpm'];
  if (variant.torqueCurve && variant.torqueCurve.length >= 3) {
    const xs = variant.torqueCurve.map((p) => p.rpm);
    const ys = variant.torqueCurve.map((p) => p.torque);
    const start = xs[0] ?? idle;
    const end = xs[xs.length - 1] ?? sweepEnd(variant, k);
    const f = pchip(xs, ys);
    const grid = rpmGrid(Math.min(start, idle), end);
    return {
      grid,
      torque: grid.map((n) => (n < start ? Number.NaN : f(n))),
      start,
      anchors: xs,
      source: 'published-curve',
    };
  }

  const t = variant.rating.torque.value;
  const nT = variant.rating.torqueRpm.value;
  const nP = variant.rating.powerRpm.value;
  const tP = variant.rating.power.value / omega(nP);
  const end = sweepEnd(variant, k);
  const grid = rpmGrid(idle, end);

  let start = idle;
  let rise: (n: number) => number;
  if (boosted) {
    start = Math.max(idle + 400, nT - k['turbo-spool-offset-rpm']);
    const tS = k['turbo-spool-torque-fraction'] * t;
    const [a, b] = monotoneSlopes(start, tS, (2 * (t - tS)) / (nT - start), nT, t, 0);
    rise = (n) => hermite(n, start, tS, a, nT, t, b);
  } else {
    const t0 = k['na-idle-torque-fraction'] * t;
    const [a, b] = monotoneSlopes(
      idle,
      t0,
      (k['na-idle-slope-factor'] * (t - t0)) / (nT - idle),
      nT,
      t,
      0,
    );
    rise = (n) => hermite(n, idle, t0, a, nT, t, b);
  }
  const middle = peakToPeak(nT, t, nP, tP);
  const tail = pastPeak(nP, tP, end, boosted ? k['power-drop-boosted'] : k['power-drop-na']);
  const torque = grid.map((n) => {
    if (n < start) return Number.NaN;
    if (n <= nT) return rise(n);
    if (n <= nP) return middle(n);
    return tail(n);
  });
  return { grid, torque, start, anchors: [nT, nP], source: 'peaks' };
}
