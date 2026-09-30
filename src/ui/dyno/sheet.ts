import type { SimWeight } from '../../data/sim-data';
import type { LimitCheck, LimitStatus } from '../../sim/limits';
import { hasNumbers, type DynoReport, type PassedReport } from '../../sim/report';
import { renderChart, type ChartHandle } from './chart';
import { h } from './dom';
import {
  num,
  percentText,
  powerText,
  pressureText,
  rpmText,
  temperatureText,
  torqueText,
  type DisplayUnits,
} from './format';

/**
 * The dyno sheet for one trim: what it is, the stock-check sticker, the peak
 * readouts at the user's conditions, the chart, the limit tags and what's
 * estimated. When the stock check fails, only the sticker and the reasons are
 * shown (CLAUDE.md rule 3).
 */

const WEIGHT_BASIS: Record<SimWeight['basis'], string> = {
  'jis-vehicle-weight': 'Japanese vehicle weight',
  'us-curb-weight': 'US curb weight',
  'din-kerb-weight': 'DIN kerb weight',
  'eu-mass-in-running-order': 'EU mass in running order, with a 75 kg driver',
  'kerb-no-driver': 'kerb weight without driver',
  'au-kerb-mass': 'Australian kerb mass',
  unstated: 'basis not stated',
};

const STATUS: Record<LimitStatus, string> = {
  bottleneck: 'Limiting',
  'over-rating': 'Over rating',
  ok: 'OK',
  'no-data': 'No data',
  'not-modelled': 'Not modelled yet',
};
const STATUS_ORDER: LimitStatus[] = ['bottleneck', 'over-rating', 'ok', 'no-data', 'not-modelled'];

function signedPercent(fraction: number): string {
  const text = percentText(Math.abs(fraction));
  if (Math.abs(fraction) < 0.0005) return percentText(0);
  return `${fraction > 0 ? '+' : '−'}${text}`;
}

function weightText(w: SimWeight): string {
  const [lo, hi] = w.rangeKg;
  const basis = WEIGHT_BASIS[w.basis];
  const value = hi - lo < 1 ? `${num(w.kg)} kg` : `${num(lo)} to ${num(hi)} kg`;
  const printed =
    Math.abs(w.adjustmentKg) >= 1 || hi - lo >= 1
      ? `printed ${num(w.printedKg)} kg, ${basis}`
      : basis;
  return `Curb weight ${value} with a full tank and no driver (${printed}).`;
}

function identity(report: DynoReport): HTMLElement {
  const t = report.title;
  const e = report.engine;
  const engineLine = `${e.code}: ${e.induction.toLowerCase()}, ${num(e.displacementCc)} cc${
    e.rotary ? ' (rotary)' : ''
  }${e.turbos.length > 0 ? `, ${e.turbos.join(' and ')}` : ''}.`;
  return h(
    'header',
    { class: 'sheet__id' },
    h('h3', { class: 'sheet__car', text: `${t.make} ${t.model} (${t.chassis})` }),
    h('p', { class: 'sheet__trim', text: `${t.trim}, ${t.market}, ${t.period}, ${t.gearbox}` }),
    h('p', { class: 'sheet__engine', text: engineLine, attrs: { title: e.variant } }),
    h('p', { class: 'sheet__weight', text: weightText(report.weight) }),
  );
}

function sticker(report: DynoReport, units: DisplayUnits): HTMLElement {
  const c = report.calibration;
  const r = report.rating;
  const standard = r.assumed
    ? `Standard not printed: ${r.standardName} assumed`
    : `Rated to ${r.standardName}`;
  const reference = `${temperatureText(r.temperatureK, units.temperature)}, ${num(r.pressurePa / 1000, 1)} kPa ${
    r.pressureBasis === 'dry-air' ? 'dry air' : 'total'
  }, ${String(r.fuelRon)} RON`;
  // A failed check shows the factory figure and the size of the miss only, no model numbers.
  const cells = (factory: string, model: string, diff: string) =>
    c.pass ? [factory, model, diff] : [factory, diff];
  const row = (label: string, values: string[]) =>
    h(
      'tr',
      {},
      h('th', { text: label, attrs: { scope: 'row' } }),
      ...values.map((v) => h('td', { text: v })),
    );
  const table = h(
    'table',
    { class: 'sticker__table' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('td', {}),
        ...cells('Factory', 'Model', c.pass ? 'Diff' : 'Miss').map((t) =>
          h('th', { text: t, attrs: { scope: 'col' } }),
        ),
      ),
    ),
    h(
      'tbody',
      {},
      row(
        'Power',
        cells(
          `${powerText(c.power.factory, units.power)} at ${num(c.power.factoryRpm)}`,
          `${powerText(c.power.model, units.power)} at ${num(c.power.modelRpm)}`,
          signedPercent(c.power.error),
        ),
      ),
      row(
        'Torque',
        cells(
          `${torqueText(c.torque.factory, units.torque)} at ${num(c.torque.factoryRpm)}`,
          `${torqueText(c.torque.model, units.torque)} at ${num(c.torque.modelRpm)}`,
          signedPercent(c.torque.error),
        ),
      ),
    ),
  );
  const curve = c.curve;
  const curveLine =
    curve && curve.length > 0
      ? h('p', {
          text: `All ${String(curve.length)} points of the published torque curve: largest miss ${percentText(
            Math.max(...curve.map((p) => Math.abs(p.error))),
          )}.`,
        })
      : null;
  return h(
    'section',
    {
      class: `sticker ${c.pass ? 'sticker--pass' : 'sticker--fail'}`,
      attrs: { 'aria-label': 'Stock check' },
    },
    h('p', {
      class: 'sticker__verdict',
      text: c.pass ? 'Stock check passed' : 'Stock check failed: numbers withheld',
    }),
    h('p', {
      class: 'sticker__rating',
      text: `${standard}: ${reference}. Printed ${r.printed.power}, ${r.printed.torque}.`,
    }),
    table,
    curveLine,
    h('p', {
      class: 'sticker__tolerance',
      text: 'Pass mark: within 3 % and 250 rpm of each factory peak.',
    }),
    c.pass
      ? null
      : h(
          'div',
          { class: 'sticker__why' },
          h('p', {
            text: 'Swap Lab only shows simulated numbers for trims whose factory figures the model reproduces. This one misses:',
          }),
          h('ul', {}, ...c.failures.map((f) => h('li', { text: f }))),
        ),
  );
}

function readouts(report: PassedReport, units: DisplayUnits): HTMLElement {
  const pk = report.peaks;
  const ch = report.channels;
  const bandAt = (rpm: number) => ch.band[ch.rpm.indexOf(rpm)] ?? 0;
  const cell = (label: string, value: string, note: string, extra?: string) =>
    h(
      'div',
      { class: 'readout-cell' },
      h('dt', { text: label }),
      h('dd', { class: 'readout-cell__value', text: value }),
      h('dd', { class: 'readout-cell__note', text: note }),
      extra ? h('dd', { class: 'readout-cell__band', text: extra }) : null,
    );
  const gearbox =
    report.drivetrain.type === 'automatic'
      ? 'automatic'
      : report.drivetrain.type === 'automated-manual'
        ? 'automated manual'
        : 'manual';
  const cells = [
    cell(
      'Crank power',
      powerText(pk.power.value, units.power),
      `at ${rpmText(pk.power.rpm)}`,
      `± ${percentText(bandAt(pk.power.rpm))}`,
    ),
    cell(
      'Crank torque',
      torqueText(pk.torque.value, units.torque),
      `at ${rpmText(pk.torque.rpm)}`,
      `± ${percentText(bandAt(pk.torque.rpm))}`,
    ),
    cell(
      'Wheel power, estimated',
      powerText(pk.wheelPower.value, units.power),
      `gear ${String(report.drivetrain.gear)}, ${gearbox}`,
      `${percentText(1 - report.drivetrain.efficiency, 0)} drivetrain loss`,
    ),
  ];
  if (pk.boost) {
    cells.push(
      cell(
        'Peak boost',
        pressureText(pk.boost.value, units.pressure),
        `at ${rpmText(pk.boost.rpm)}`,
      ),
    );
  } else {
    const i = ch.rpm.indexOf(pk.power.rpm);
    cells.push(
      cell(
        'Charge air',
        temperatureText(ch.chargeTemperature[i] ?? 0, units.temperature),
        `at ${rpmText(pk.power.rpm)}`,
      ),
    );
  }
  const c = report.conditions;
  return h(
    'section',
    { class: 'readouts-block', attrs: { 'aria-label': 'Peak figures at your conditions' } },
    h('p', {
      class: 'readouts-block__at',
      text: `At ${temperatureText(c.temperatureC + 273.15, units.temperature)} ambient, ${num(c.pressureKPa, 1)} kPa, ${String(c.fuelRon)} RON fuel`,
    }),
    h('dl', { class: 'readout-grid' }, ...cells),
  );
}

function legend(report: PassedReport): HTMLElement {
  const item = (swatch: string, label: string) =>
    h(
      'li',
      {},
      h('span', { class: `swatch swatch--${swatch}`, attrs: { 'aria-hidden': 'true' } }),
      label,
    );
  return h(
    'ul',
    { class: 'legend', attrs: { 'aria-label': 'Chart key' } },
    item('power', 'Power'),
    item('torque', 'Torque'),
    item('band', 'Uncertainty band'),
    item('ghost', 'At the rating conditions'),
    item('factory', 'Factory figure'),
    report.channels.boost ? item('boost', 'Boost') : null,
    report.channels.boost ? item('spool', 'Below the spool point') : null,
  );
}

/** One line under the chart that reads out the crosshair's rpm. */
export function cursorText(
  report: PassedReport,
  units: DisplayUnits,
  index: number | undefined,
): string {
  if (index === undefined) {
    return 'Point at the chart, or focus it and use the arrow keys, to read any rpm.';
  }
  const ch = report.channels;
  const parts = [
    `${rpmText(ch.rpm[index] ?? 0)}:`,
    `${powerText(ch.power[index] ?? 0, units.power)},`,
    `${torqueText(ch.torque[index] ?? 0, units.torque)},`,
    `wheels ${powerText(ch.wheelPower[index] ?? 0, units.power)},`,
  ];
  if (ch.boost)
    parts.push(`boost ${pressureText(Math.max(0, ch.boost[index] ?? 0), units.pressure)},`);
  parts.push(`charge air ${temperatureText(ch.chargeTemperature[index] ?? 0, units.temperature)},`);
  parts.push(`AFR ${num(ch.afr[index] ?? 0, 1)}`);
  return parts.join(' ');
}

function curveTable(report: PassedReport, units: DisplayUnits): HTMLElement {
  const ch = report.channels;
  const rows: number[] = [];
  ch.rpm.forEach((n, i) => {
    if (n % 500 === 0 || n === report.peaks.power.rpm || n === report.peaks.torque.rpm)
      rows.push(i);
  });
  const head = ['rpm', `Power`, `Torque`, 'Wheels', ...(ch.boost ? ['Boost'] : []), '±'];
  return h(
    'details',
    { class: 'curve-table' },
    h('summary', { text: 'Curve as a table' }),
    h(
      'table',
      {},
      h(
        'thead',
        {},
        h('tr', {}, ...head.map((c) => h('th', { text: c, attrs: { scope: 'col' } }))),
      ),
      h(
        'tbody',
        {},
        ...rows.map((i) =>
          h(
            'tr',
            {},
            h('th', { text: num(ch.rpm[i] ?? 0), attrs: { scope: 'row' } }),
            h('td', { text: powerText(ch.power[i] ?? 0, units.power) }),
            h('td', { text: torqueText(ch.torque[i] ?? 0, units.torque) }),
            h('td', { text: powerText(ch.wheelPower[i] ?? 0, units.power) }),
            ch.boost
              ? h('td', { text: pressureText(Math.max(0, ch.boost[i] ?? 0), units.pressure) })
              : null,
            h('td', { text: percentText(ch.band[i] ?? 0) }),
          ),
        ),
      ),
    ),
  );
}

function limitsBlock(limits: readonly LimitCheck[]): HTMLElement {
  const sorted = [...limits].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
  const counts = STATUS_ORDER.map((status) => ({
    status,
    n: limits.filter((l) => l.status === status).length,
  })).filter((c) => c.n > 0);
  const binding = limits.some((l) => l.status === 'bottleneck' || l.status === 'over-rating');
  const details = h(
    'details',
    { class: 'limits' },
    h(
      'summary',
      {},
      h('span', { class: 'sheet__h', text: 'Limits' }),
      h('span', {
        class: 'limits__count',
        text: counts.map((c) => `${String(c.n)} ${STATUS[c.status].toLowerCase()}`).join(', '),
      }),
    ),
    h(
      'ul',
      { class: 'limit-tags' },
      ...sorted.map((l) =>
        h(
          'li',
          { class: `limit-tag limit-tag--${l.status}` },
          h('span', { class: 'limit-tag__name', text: l.name }),
          h('span', {
            class: 'limit-tag__status',
            text:
              l.utilisation !== undefined && (l.status === 'ok' || l.status === 'bottleneck')
                ? `${STATUS[l.status]}, ${percentText(l.utilisation, 0)} of limit`
                : STATUS[l.status],
          }),
          h('span', { class: 'limit-tag__detail', text: l.detail }),
        ),
      ),
    ),
  );
  details.open = binding;
  return details;
}

function estimatesBlock(report: DynoReport): HTMLElement | null {
  if (report.estimates.length === 0) return null;
  return h(
    'section',
    { class: 'estimates', attrs: { 'aria-labelledby': 'estimates-title' } },
    h('h4', { id: 'estimates-title', class: 'sheet__h', text: 'Estimated for this trim' }),
    h('ul', {}, ...report.estimates.map((e) => h('li', { text: e }))),
  );
}

export interface Sheet {
  root: HTMLElement;
  /** Draws (or redraws) the chart at the host's current width. */
  drawChart(): void;
}

export function buildSheet(report: DynoReport, units: DisplayUnits): Sheet {
  const root = h('div', { class: 'sheet' }, identity(report), sticker(report, units));
  if (!hasNumbers(report)) return { root, drawChart: () => undefined };

  const chartHost = h('div', { class: 'chart-host' });
  const cursorLine = h('p', {
    class: 'cursor-line',
    text: cursorText(report, units, undefined),
    attrs: { 'aria-live': 'polite' },
  });
  root.append(
    readouts(report, units),
    chartHost,
    legend(report),
    cursorLine,
    curveTable(report, units),
    limitsBlock(report.limits),
  );
  const estimates = estimatesBlock(report);
  if (estimates) root.append(estimates);

  let handle: ChartHandle | undefined;
  let drawnWidth = 0;
  const drawChart = () => {
    const width = Math.floor(chartHost.clientWidth);
    if (width < 200 || Math.abs(width - drawnWidth) < 2) return;
    drawnWidth = width;
    const next = renderChart(report, width, units, (index) => {
      cursorLine.textContent = cursorText(report, units, index);
    });
    next.svg.setAttribute('aria-label', chartLabel(report, units));
    if (handle) handle.svg.replaceWith(next.svg);
    else chartHost.append(next.svg);
    handle = next;
  };
  return { root, drawChart };
}

function chartLabel(report: PassedReport, units: DisplayUnits): string {
  const pk = report.peaks;
  const ch = report.channels;
  return `Dyno chart from ${rpmText(ch.rpm[0] ?? 0)} to ${rpmText(ch.rpm[ch.rpm.length - 1] ?? 0)}: peak power ${powerText(
    pk.power.value,
    units.power,
  )} at ${rpmText(pk.power.rpm)}, peak torque ${torqueText(pk.torque.value, units.torque)} at ${rpmText(
    pk.torque.rpm,
  )}. Use the arrow keys to read other rpm points.`;
}

/** Short text for the panel header: the peaks, then the conditions (dropped on a phone). */
export function summaryText(
  report: DynoReport,
  units: DisplayUnits,
): { peaks: string; at: string } {
  if (!hasNumbers(report)) return { peaks: 'Numbers withheld', at: '' };
  return {
    peaks: `${powerText(report.peaks.power.value, units.power)}, ${torqueText(
      report.peaks.torque.value,
      units.torque,
    )}`,
    at: ` at ${temperatureText(report.conditions.temperatureC + 273.15, units.temperature)}`,
  };
}
