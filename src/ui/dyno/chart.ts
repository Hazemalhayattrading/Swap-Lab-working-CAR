import type { PassedReport } from '../../sim/report';
import {
  niceStep,
  num,
  powerIn,
  pressureIn,
  torqueIn,
  torqueLabel,
  type DisplayUnits,
} from './format';

/**
 * The dyno sheet's chart (BUILD_PROMPT 4: custom SVG, no chart library):
 * power and torque against rpm with the uncertainty band, the model at the
 * rating's own conditions as a dotted reference, the factory figures as
 * crosses, masking-tape labels on the peaks, and a boost channel underneath
 * for turbo engines, as on dyno software. A crosshair follows the pointer or
 * the arrow keys.
 */

const NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number>;

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Attrs,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  parent?.appendChild(node);
  return node;
}

function text(parent: Element, x: number, y: number, content: string, attrs: Attrs = {}) {
  const t = el('text', { x, y, ...attrs }, parent);
  t.textContent = content;
  return t;
}

function path(points: [number, number][]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join('');
}

/** Top of the axis for `max` split into `steps` round intervals. */
function axis(max: number, steps: number): { top: number; step: number } {
  const step = niceStep((max * 1.04) / steps);
  return { top: step * steps, step };
}

const MAIN_HEIGHT = 250;
const STRIP_HEIGHT = 74;
const MARGIN = { left: 46, right: 50, top: 22, bottom: 36 };
const INTERVALS = 5;

export interface ChartHandle {
  svg: SVGSVGElement;
  /** Moves the crosshair to a sample index (keyboard control). */
  focusIndex(index: number): void;
}

export function renderChart(
  report: PassedReport,
  width: number,
  units: DisplayUnits,
  onCursor: (index: number | undefined) => void,
): ChartHandle {
  const ch = report.channels;
  const rpm = ch.rpm;
  const boosted = ch.boost !== undefined;
  const height = MAIN_HEIGHT + (boosted ? STRIP_HEIGHT : 0);
  const svg = el('svg', {
    viewBox: `0 0 ${String(width)} ${String(height)}`,
    width,
    height,
    class: 'chart',
    role: 'img',
    tabindex: 0,
  });

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = MAIN_HEIGHT - MARGIN.top - MARGIN.bottom;
  const n0 = rpm[0] ?? 0;
  const n1 = rpm[rpm.length - 1] ?? 1;
  const x = (n: number) => MARGIN.left + ((n - n0) / (n1 - n0)) * plotW;

  const t = ch.torque.map((v) => torqueIn(v, units.torque));
  const p = ch.power.map((v) => powerIn(v, units.power));
  const tr = ch.ratingTorque.map((v) => torqueIn(v, units.torque));
  const pr = ch.ratingPower.map((v) => powerIn(v, units.power));
  const band = ch.band;
  const hi = (a: number[]) => a.map((v, i) => v * (1 + (band[i] ?? 0)));
  const lo = (a: number[]) => a.map((v, i) => v * (1 - (band[i] ?? 0)));
  const tAxis = axis(Math.max(...hi(t), ...tr), INTERVALS);
  const pAxis = axis(Math.max(...hi(p), ...pr), INTERVALS);
  const yT = (v: number) => MARGIN.top + plotH * (1 - v / tAxis.top);
  const yP = (v: number) => MARGIN.top + plotH * (1 - v / pAxis.top);

  // Patterns: hatching for the turbo spool region.
  const defs = el('defs', {}, svg);
  const hatch = el(
    'pattern',
    {
      id: 'spool-hatch',
      width: 6,
      height: 6,
      patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)',
    },
    defs,
  );
  el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'chart__hatch' }, hatch);

  el(
    'rect',
    { x: MARGIN.left, y: MARGIN.top, width: plotW, height: plotH, class: 'chart__screen' },
    svg,
  );

  const grid = el('g', { class: 'chart__grid' }, svg);
  for (let i = 0; i <= INTERVALS; i++) {
    const y = MARGIN.top + (plotH * i) / INTERVALS;
    el('line', { x1: MARGIN.left, x2: MARGIN.left + plotW, y1: y, y2: y }, grid);
    const tv = tAxis.top - tAxis.step * i;
    const pv = pAxis.top - pAxis.step * i;
    text(grid, MARGIN.left - 6, y + 4, num(tv), { class: 'chart__tick chart__tick--left' });
    text(grid, MARGIN.left + plotW + 6, y + 4, num(pv), {
      class: 'chart__tick chart__tick--right',
    });
  }
  for (let n = Math.ceil(n0 / 500) * 500; n <= n1; n += 500) {
    const major = n % 1000 === 0;
    el(
      'line',
      {
        x1: x(n),
        x2: x(n),
        y1: MARGIN.top,
        y2: MARGIN.top + plotH,
        class: major ? 'chart__major' : 'chart__minor',
      },
      grid,
    );
    if (major) {
      text(grid, x(n), MARGIN.top + plotH + 16, num(n / 1000), {
        class: 'chart__tick chart__tick--x',
      });
    }
  }
  text(svg, MARGIN.left, 14, `Torque, ${torqueLabel(units.torque)}`, { class: 'chart__axis' });
  text(svg, MARGIN.left + plotW, 14, `Power, ${units.power}`, {
    class: 'chart__axis chart__axis--right',
  });
  text(svg, MARGIN.left + plotW / 2, MARGIN.top + plotH + 31, 'rpm × 1000', {
    class: 'chart__tick chart__tick--x',
  });

  if (boosted && report.curve.spoolRpm !== undefined && report.curve.spoolRpm > n0) {
    el(
      'rect',
      {
        x: MARGIN.left,
        y: MARGIN.top,
        width: x(report.curve.spoolRpm) - MARGIN.left,
        height: plotH,
        fill: 'url(#spool-hatch)',
        class: 'chart__spool',
      },
      svg,
    );
  }

  const series = (values: number[], y: (v: number) => number): [number, number][] =>
    values.map((v, i) => [x(rpm[i] ?? 0), y(v)]);
  const bandPath = (upper: number[], lower: number[], y: (v: number) => number) =>
    `${path(series(upper, y))}${path(series(lower, y).reverse()).replace(/^M/, 'L')}Z`;

  el('path', { d: bandPath(hi(t), lo(t), yT), class: 'chart__band chart__band--torque' }, svg);
  el('path', { d: bandPath(hi(p), lo(p), yP), class: 'chart__band chart__band--power' }, svg);
  el('path', { d: path(series(tr, yT)), class: 'chart__ghost' }, svg);
  el('path', { d: path(series(pr, yP)), class: 'chart__ghost' }, svg);
  el('path', { d: path(series(t, yT)), class: 'chart__trace chart__trace--torque' }, svg);
  el('path', { d: path(series(p, yP)), class: 'chart__trace chart__trace--power' }, svg);

  // Factory figures, at their own rpm, on the rating-conditions trace's axes.
  const cal = report.calibration;
  const cross = (cx: number, cy: number) => {
    const g = el('g', { class: 'chart__factory' }, svg);
    el('line', { x1: cx - 4, x2: cx + 4, y1: cy, y2: cy }, g);
    el('line', { x1: cx, x2: cx, y1: cy - 4, y2: cy + 4 }, g);
  };
  cross(x(cal.torque.factoryRpm), yT(torqueIn(cal.torque.factory, units.torque)));
  cross(x(cal.power.factoryRpm), yP(powerIn(cal.power.factory, units.power)));

  // Masking-tape labels on this run's peaks.
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  const tape = (cx: number, cy: number, label: string) => {
    const w = label.length * 6.4 + 12;
    const h = 17;
    let bx = Math.min(Math.max(cx - w / 2, MARGIN.left + 2), MARGIN.left + plotW - w - 2);
    let by = cy - h - 9;
    if (by < MARGIN.top + 2) by = cy + 9;
    for (const b of boxes) {
      const overlap = bx < b.x + b.w && bx + w > b.x && by < b.y + b.h && by + h > b.y;
      if (overlap) by = cy + 9;
    }
    bx = Math.round(bx);
    by = Math.round(by);
    boxes.push({ x: bx, y: by, w, h });
    const g = el(
      'g',
      {
        class: 'chart__tape',
        transform: `rotate(-1.2 ${String(bx + w / 2)} ${String(by + h / 2)})`,
      },
      svg,
    );
    el('rect', { x: bx, y: by, width: w, height: h }, g);
    text(g, bx + w / 2, by + 12.5, label);
    el('circle', { cx, cy, r: 2.6, class: 'chart__peak' }, svg);
  };
  const pk = report.peaks;
  const iP = rpm.indexOf(pk.power.rpm);
  const iT = rpm.indexOf(pk.torque.rpm);
  tape(
    x(pk.power.rpm),
    yP(p[iP] ?? 0),
    `${num(p[iP] ?? 0)} ${units.power} at ${num(pk.power.rpm)}`,
  );
  tape(
    x(pk.torque.rpm),
    yT(t[iT] ?? 0),
    `${num(t[iT] ?? 0)} ${torqueLabel(units.torque)} at ${num(pk.torque.rpm)}`,
  );

  // Boost channel.
  let yB: ((v: number) => number) | undefined;
  let b: number[] = [];
  if (ch.boost) {
    b = ch.boost.map((v) => pressureIn(Math.max(0, v), units.pressure));
    const top = MAIN_HEIGHT + 8;
    const stripH = STRIP_HEIGHT - 26;
    const bAxis = axis(Math.max(...b, 0.1), 2);
    const yBoost = (v: number) => top + stripH * (1 - v / bAxis.top);
    yB = yBoost;
    el(
      'rect',
      { x: MARGIN.left, y: top, width: plotW, height: stripH, class: 'chart__screen' },
      svg,
    );
    const strip = el('g', { class: 'chart__grid' }, svg);
    for (let i = 0; i <= 2; i++) {
      const y = top + (stripH * i) / 2;
      el('line', { x1: MARGIN.left, x2: MARGIN.left + plotW, y1: y, y2: y }, strip);
      text(
        strip,
        MARGIN.left - 6,
        y + 4,
        num(bAxis.top - bAxis.step * i, units.pressure === 'bar' ? 1 : 0),
        {
          class: 'chart__tick chart__tick--left',
        },
      );
    }
    if (report.curve.changeoverRpm !== undefined) {
      const cx = x(report.curve.changeoverRpm);
      el('line', { x1: cx, x2: cx, y1: top, y2: top + stripH, class: 'chart__changeover' }, svg);
      text(svg, cx + 4, top + 11, 'second turbo', { class: 'chart__note' });
    }
    el(
      'path',
      {
        d: path(b.map((v, i) => [x(rpm[i] ?? 0), yBoost(v)])),
        class: 'chart__trace chart__trace--boost',
      },
      svg,
    );
    text(svg, MARGIN.left + 6, top + 11, `Boost, ${units.pressure}`, {
      class: 'chart__tick chart__tick--inset',
    });
  }

  // Crosshair.
  const cursor = el('g', { class: 'chart__cursor', visibility: 'hidden' }, svg);
  const cursorLine = el(
    'line',
    { y1: MARGIN.top, y2: height - (boosted ? 18 : MARGIN.bottom) },
    cursor,
  );
  const dotT = el('circle', { r: 3, class: 'chart__dot chart__dot--torque' }, cursor);
  const dotP = el('circle', { r: 3, class: 'chart__dot chart__dot--power' }, cursor);
  const dotB = el('circle', { r: 3, class: 'chart__dot chart__dot--boost' }, cursor);
  let current: number | undefined;
  const place = (index: number | undefined) => {
    current = index;
    if (index === undefined) {
      cursor.setAttribute('visibility', 'hidden');
      onCursor(undefined);
      return;
    }
    const cx = x(rpm[index] ?? 0);
    cursor.setAttribute('visibility', 'visible');
    cursorLine.setAttribute('x1', String(cx));
    cursorLine.setAttribute('x2', String(cx));
    dotT.setAttribute('cx', String(cx));
    dotT.setAttribute('cy', String(yT(t[index] ?? 0)));
    dotP.setAttribute('cx', String(cx));
    dotP.setAttribute('cy', String(yP(p[index] ?? 0)));
    if (yB) {
      dotB.setAttribute('cx', String(cx));
      dotB.setAttribute('cy', String(yB(b[index] ?? 0)));
    } else {
      dotB.setAttribute('visibility', 'hidden');
    }
    onCursor(index);
  };
  const hit = el('rect', { x: MARGIN.left, y: 0, width: plotW, height, class: 'chart__hit' }, svg);
  hit.addEventListener('pointermove', (event) => {
    const box = svg.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * width;
    const n = n0 + ((px - MARGIN.left) / plotW) * (n1 - n0);
    const index = Math.round((n - n0) / 100);
    place(Math.min(Math.max(index, 0), rpm.length - 1));
  });
  hit.addEventListener('pointerleave', () => {
    place(undefined);
  });
  svg.addEventListener('keydown', (event) => {
    const last = rpm.length - 1;
    const now = current ?? Math.max(0, iP);
    const next =
      event.key === 'ArrowRight'
        ? Math.min(last, now + 1)
        : event.key === 'ArrowLeft'
          ? Math.max(0, now - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined;
    if (next === undefined) {
      if (event.key === 'Escape') place(undefined);
      return;
    }
    event.preventDefault();
    place(next);
  });
  svg.addEventListener('blur', () => {
    place(undefined);
  });

  return { svg, focusIndex: place };
}
