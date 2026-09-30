import type { PassedReport } from '../../sim/report';
import { fitAxis } from './axes';
import { h } from './dom';
import { num, percentText, temperatureIn, temperatureText, type DisplayUnits } from './format';

/**
 * The heat-soak test card (BUILD_PROMPT 6.2): the 3-minute sustained drift
 * session, stamped like an inspection tag, with the coolant (coolant cyan) and
 * oil (tape amber) traces against their limits. Only a car's own radiator
 * figures earn a passed or failed stamp; on the generic sizing every car gets
 * until then, the stamp says estimated (the owner, 2026-09-30).
 */

const SVG = 'http://www.w3.org/2000/svg';
const W = 320;
const H = 132;
const PAD = { left: 34, right: 8, top: 10, bottom: 20 };

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

const clock = (s: number): string =>
  `${String(Math.floor(s / 60))}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function traces(report: PassedReport, units: DisplayUnits): SVGSVGElement {
  const soak = report.heatSoak;
  const t = units.temperature;
  const temp = (k: number) => temperatureIn(k, t);
  const lo = Math.min(...soak.samples.map((s) => temp(s.coolant)), temp(soak.limits.coolant)) - 5;
  const hiRaw = Math.max(
    ...soak.samples.map((s) => Math.max(temp(s.coolant), temp(s.oil))),
    temp(soak.limits.oil),
  );
  const floor = Math.floor(lo / 10) * 10;
  const axis = fitAxis(hiRaw - floor, [3, 4]);
  const top = floor + axis.top;
  const x = (s: number) => PAD.left + (s / soak.duration) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - floor) / (top - floor)) * (H - PAD.top - PAD.bottom);
  const root = svg('svg', {
    viewBox: `0 0 ${String(W)} ${String(H)}`,
    class: 'soak-chart',
    role: 'img',
  });
  for (let i = 0; i <= axis.intervals; i++) {
    const v = floor + i * axis.step;
    root.append(
      svg('line', {
        x1: PAD.left,
        x2: W - PAD.right,
        y1: y(v),
        y2: y(v),
        class: 'soak-chart__grid',
      }),
    );
    const label = svg('text', {
      x: PAD.left - 4,
      y: y(v) + 3,
      class: 'soak-chart__tick',
      'text-anchor': 'end',
    });
    label.textContent = num(v);
    root.append(label);
  }
  for (let m = 0; m <= soak.duration; m += 60) {
    const anchor = m === 0 ? 'start' : m + 60 > soak.duration ? 'end' : 'middle';
    const label = svg('text', {
      x: x(m),
      y: H - 6,
      class: 'soak-chart__tick',
      'text-anchor': anchor,
    });
    label.textContent = clock(m);
    root.append(label);
  }
  const limit = (k: number, cls: string) =>
    svg('line', { x1: PAD.left, x2: W - PAD.right, y1: y(temp(k)), y2: y(temp(k)), class: cls });
  root.append(
    limit(soak.limits.coolant, 'soak-chart__limit soak-chart__limit--coolant'),
    limit(soak.limits.oil, 'soak-chart__limit soak-chart__limit--oil'),
  );
  const path = (pick: (s: PassedReport['heatSoak']['samples'][number]) => number) =>
    soak.samples
      .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.time).toFixed(1)},${y(temp(pick(s))).toFixed(1)}`)
      .join('');
  root.append(
    svg('path', { d: path((s) => s.oil), class: 'soak-chart__line soak-chart__line--oil' }),
    svg('path', { d: path((s) => s.coolant), class: 'soak-chart__line soak-chart__line--coolant' }),
  );
  if (soak.failedAt !== undefined) {
    root.append(
      svg('line', {
        x1: x(soak.failedAt),
        x2: x(soak.failedAt),
        y1: PAD.top,
        y2: H - PAD.bottom,
        class: soak.basis === 'car-data' ? 'soak-chart__fail' : 'soak-chart__cross',
      }),
    );
  }
  root.setAttribute(
    'aria-label',
    `Coolant rises to ${temperatureText(soak.peakCoolant, t)} and oil to ${temperatureText(soak.peakOil, t)} over the ${clock(soak.duration)} session; limits ${temperatureText(soak.limits.coolant, t)} and ${temperatureText(soak.limits.oil, t)}.`,
  );
  return root;
}

function stampFor(soak: PassedReport['heatSoak']): HTMLElement {
  if (soak.basis === 'generic-sizing') {
    return h(
      'p',
      {
        class: 'soak-stamp soak-stamp--estimated',
        attrs: { 'aria-label': 'Heat-soak test: estimated, generic sizing' },
      },
      h('span', { class: 'soak-stamp__word', text: 'Estimated' }),
      h('span', { class: 'soak-stamp__when', text: 'generic sizing' }),
    );
  }
  return h(
    'p',
    {
      class: `soak-stamp soak-stamp--${soak.pass ? 'pass' : 'fail'}`,
      attrs: { 'aria-label': soak.pass ? 'Heat-soak test passed' : 'Heat-soak test failed' },
    },
    h('span', { class: 'soak-stamp__word', text: soak.pass ? 'Passed' : 'Failed' }),
    soak.failedAt !== undefined
      ? h('span', {
          class: 'soak-stamp__when',
          text: `${soak.failedOn === 'oil' ? 'oil' : 'coolant'} at ${clock(soak.failedAt)}`,
        })
      : h('span', { class: 'soak-stamp__when', text: `all ${clock(soak.duration)}` }),
  );
}

function verdictFor(soak: PassedReport['heatSoak'], units: DisplayUnits): string {
  const t = units.temperature;
  const temps = soak.pass
    ? `coolant peaks at ${temperatureText(soak.peakCoolant, t)}, oil at ${temperatureText(soak.peakOil, t)}`
    : `coolant reaches ${temperatureText(soak.peakCoolant, t)} against a ${temperatureText(soak.limits.coolant, t)} limit, oil ${temperatureText(soak.peakOil, t)} against ${temperatureText(soak.limits.oil, t)}`;
  if (soak.basis === 'generic-sizing') {
    const outcome = soak.pass
      ? 'the cooling holds'
      : `the ${soak.failedOn === 'oil' ? 'oil' : 'coolant'} passes its limit at ${clock(soak.failedAt ?? 0)}`;
    return `With generic sizing ${outcome}: ${temps}. No radiator figures for this car are on file yet, so its cooling is sized by the rule every car gets, and this is an estimate, not a pass or fail.`;
  }
  return soak.pass
    ? `The factory cooling holds: ${temps}.`
    : `The factory cooling runs out: ${temps}. Cooling parts (Phase 3) are where this gets fixed.`;
}

export function heatSoakBlock(report: PassedReport, units: DisplayUnits): HTMLElement {
  const soak = report.heatSoak;
  const t = units.temperature;
  const [low, high] = soak.load;
  const stamp = stampFor(soak);
  const brief = `${clock(soak.duration)} at ${percentText(low, 0)} to ${percentText(high, 0)} load, ${num(soak.faceVelocity, 0)} m/s of air through the radiator, ${temperatureText(soak.ambient, t)} ambient.`;
  const verdict = verdictFor(soak, units);
  return h(
    'section',
    { class: 'soak', attrs: { 'aria-labelledby': 'soak-title' } },
    h(
      'div',
      { class: 'soak__head' },
      h(
        'div',
        {},
        h('h4', { id: 'soak-title', class: 'sheet__h', text: 'Heat-soak test' }),
        h('p', { class: 'soak__brief', text: `Sustained drift session: ${brief}` }),
      ),
      stamp,
    ),
    traces(report, units),
    h(
      'ul',
      { class: 'soak__key', attrs: { 'aria-label': 'Heat-soak chart key' } },
      h('li', { class: 'soak__key-coolant', text: 'Coolant' }),
      h('li', { class: 'soak__key-oil', text: 'Oil' }),
      h('li', { class: 'soak__key-limit', text: 'Limit' }),
    ),
    h('p', { class: 'soak__verdict', text: verdict }),
  );
}
