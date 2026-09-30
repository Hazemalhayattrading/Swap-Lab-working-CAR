import type { SimClient } from '../../app/sim-client';
import type { CatalogueIndex } from '../../app/sim-protocol';
import type { DynoReport } from '../../sim/report';
import type { UserConditions } from '../../sim/simulate';
import { byId, h, keyRow } from './dom';
import {
  DEFAULT_UNITS,
  POWER_UNITS,
  PRESSURE_UNITS,
  TEMPERATURE_UNITS,
  TORQUE_UNITS,
  num,
  temperatureIn,
  torqueLabel,
  type DisplayUnits,
} from './format';
import { buildManual } from './manual';
import { buildSheet, summaryText, type Sheet } from './sheet';

/**
 * The dyno sheet panel: pick a car and trim, the ambient and the fuel, and
 * read the simulated curve. Docked on the right on a wide screen and a bottom
 * sheet on a phone, collapsible either way, so the 3D bay stays the hero.
 * The simulation runs in the worker (SimClient); nothing here computes numbers.
 */

const STORAGE_KEY = 'swaplab.dyno';
const DEFAULT_CAR = 'nissan-silvia-s15';
const DEFAULT_TRIM = 'jdm-spec-r-6mt';
const PHONE = '(max-width: 40rem)';

const MARKETS: Record<string, string> = {
  JDM: 'Japan (JDM)',
  USDM: 'USA (USDM)',
  CDM: 'Canada (CDM)',
  EUDM: 'Europe (EUDM)',
  UKDM: 'UK (UKDM)',
  AUDM: 'Australia (AUDM)',
  NZDM: 'New Zealand (NZDM)',
  other: 'Other markets',
};

interface DynoState {
  carId: string;
  trimId: string;
  ambientC: number;
  fuelRon: number;
  units: DisplayUnits;
  /** Undefined until the user toggles: then it follows the screen size. */
  open: boolean | undefined;
}

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.find((o) => o === value) ?? fallback;
}

function readStored(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writeStored(state: DynoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage disabled: the choices just won't persist.
  }
}

export class DynoPanel {
  private readonly root = byId('dyno');
  private readonly body = byId('dyno-body');
  private readonly toggle = byId('dyno-toggle') as HTMLButtonElement;
  private readonly summary = byId('dyno-summary');
  private readonly controls = byId('dyno-controls');
  private readonly sheetHost = byId('dyno-sheet');
  private readonly foot = byId('dyno-foot');
  private readonly status = byId('dyno-status');
  private readonly manual = byId('dyno-manual') as HTMLDialogElement;
  private readonly manualBody = byId('manual-body');
  private index: CatalogueIndex | undefined;
  private report: DynoReport | undefined;
  private sheet: Sheet | undefined;
  private manualUnits: DisplayUnits | undefined;
  private runs = 0;
  private state: DynoState;

  constructor(private readonly client: SimClient) {
    const stored = readStored();
    const units = (
      typeof stored.units === 'object' && stored.units !== null ? stored.units : {}
    ) as Record<string, unknown>;
    this.state = {
      carId: typeof stored.carId === 'string' ? stored.carId : DEFAULT_CAR,
      trimId: typeof stored.trimId === 'string' ? stored.trimId : DEFAULT_TRIM,
      ambientC: typeof stored.ambientC === 'number' ? stored.ambientC : 45,
      fuelRon: typeof stored.fuelRon === 'number' ? stored.fuelRon : 95,
      units: {
        power: pick(units.power, POWER_UNITS, DEFAULT_UNITS.power),
        torque: pick(units.torque, TORQUE_UNITS, DEFAULT_UNITS.torque),
        pressure: pick(units.pressure, PRESSURE_UNITS, DEFAULT_UNITS.pressure),
        temperature: pick(units.temperature, TEMPERATURE_UNITS, DEFAULT_UNITS.temperature),
      },
      open: typeof stored.open === 'boolean' ? stored.open : undefined,
    };
    this.setOpen(this.state.open ?? !matchMedia(PHONE).matches, false);
    this.toggle.addEventListener('click', () => {
      this.setOpen(this.root.dataset.open !== 'true', true);
    });
    byId('manual-close').addEventListener('click', () => {
      this.manual.close();
    });
    // A click on the backdrop (outside the drawer's box) closes it too.
    this.manual.addEventListener('click', (event) => {
      if (event.target === this.manual) this.manual.close();
    });
    new ResizeObserver(() => {
      this.sheet?.drawChart();
      this.publishSize();
    }).observe(this.root);
  }

  async start(): Promise<void> {
    try {
      this.index = await this.client.ready;
    } catch (error) {
      this.fail(error);
      return;
    }
    const index = this.index;
    const car = index.cars.find((c) => c.id === this.state.carId) ?? index.cars[0];
    if (!car) return;
    this.state.carId = car.id;
    if (!car.trims.some((t) => t.id === this.state.trimId))
      this.state.trimId = car.trims[0]?.id ?? '';
    if (!index.ambientPresets.includes(this.state.ambientC))
      this.state.ambientC = index.defaults.temperatureC;
    if (!index.pumpFuels.some((f) => f.ron === this.state.fuelRon))
      this.state.fuelRon = index.defaults.fuelRon;
    this.buildControls();
    this.buildFoot();
    await this.run();
  }

  private setOpen(open: boolean, remember: boolean): void {
    this.root.dataset.open = String(open);
    this.body.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    this.toggle.textContent = open ? 'Hide sheet' : 'Show sheet';
    if (remember) {
      this.state.open = open;
      writeStored(this.state);
    }
    document.documentElement.dataset.dynoOpen = String(open);
    if (open) this.sheet?.drawChart();
    this.publishSize();
  }

  /** Lets the empty-bay note centre itself in the space the panel leaves. */
  private publishSize(): void {
    const style = document.documentElement.style;
    const phone = matchMedia(PHONE).matches;
    const dock = Math.max(0, window.innerWidth - this.root.getBoundingClientRect().left);
    style.setProperty('--dock-width', phone ? '0px' : `${String(Math.round(dock))}px`);
    style.setProperty('--sheet-height', phone ? `${String(this.root.offsetHeight)}px` : '0px');
  }

  private conditions(): UserConditions {
    const defaults = this.index?.defaults;
    return {
      temperatureC: this.state.ambientC,
      pressureKPa: defaults?.pressureKPa ?? 101.325,
      relativeHumidity: defaults?.relativeHumidity ?? 0.1,
      fuelRon: this.state.fuelRon,
    };
  }

  private changed(rerun: boolean): void {
    writeStored(this.state);
    if (rerun) void this.run();
    else this.render();
  }

  private buildControls(): void {
    const index = this.index;
    if (!index) return;
    const carSelect = h('select', { id: 'dyno-car' });
    for (const car of index.cars) {
      const option = h('option', { text: car.label, attrs: { value: car.id } });
      option.selected = car.id === this.state.carId;
      carSelect.append(option);
    }
    const trimSelect = h('select', { id: 'dyno-trim' });
    const fillTrims = () => {
      const car = index.cars.find((c) => c.id === this.state.carId);
      trimSelect.replaceChildren();
      const markets = [...new Set(car?.trims.map((t) => t.market))];
      for (const market of markets) {
        const group = h('optgroup', { attrs: { label: MARKETS[market] ?? market } });
        for (const trim of car?.trims.filter((t) => t.market === market) ?? []) {
          const option = h('option', {
            text: `${trim.label}, ${trim.gearbox}, ${trim.period}`,
            attrs: { value: trim.id },
          });
          option.selected = trim.id === this.state.trimId;
          group.append(option);
        }
        trimSelect.append(group);
      }
    };
    fillTrims();
    carSelect.addEventListener('change', () => {
      const car = index.cars.find((c) => c.id === carSelect.value);
      if (!car) return;
      this.state.carId = car.id;
      this.state.trimId = car.trims[0]?.id ?? '';
      fillTrims();
      this.changed(true);
    });
    trimSelect.addEventListener('change', () => {
      this.state.trimId = trimSelect.value;
      this.changed(true);
    });

    const t = this.state.units.temperature;
    const ambient = keyRow(
      'dyno-ambient',
      `Ambient, ${t}`,
      index.ambientPresets.map((c) => ({ value: c, label: num(temperatureIn(c + 273.15, t)) })),
      this.state.ambientC,
      (value) => {
        this.state.ambientC = value;
        this.changed(true);
      },
    );
    const fuel = keyRow(
      'dyno-fuel',
      'Fuel, RON',
      index.pumpFuels.map((f) => ({ value: f.ron, label: String(f.ron), title: f.name })),
      this.state.fuelRon,
      (value) => {
        this.state.fuelRon = value;
        this.changed(true);
      },
    );
    this.controls.replaceChildren(
      h('label', { class: 'field' }, h('span', { text: 'Car' }), carSelect),
      h('label', { class: 'field' }, h('span', { text: 'Trim' }), trimSelect),
      h('div', { class: 'dyno__conditions' }, ambient, fuel),
    );
  }

  private buildFoot(): void {
    const u = this.state.units;
    const set = <K extends keyof DisplayUnits>(key: K, value: DisplayUnits[K]) => {
      const next = { ...this.state.units };
      next[key] = value;
      this.state.units = next;
      if (key === 'temperature') this.buildControls();
      this.changed(false);
    };
    const how = h('button', {
      class: 'dyno__how',
      id: 'dyno-how',
      text: 'How we calculate this',
      attrs: { type: 'button', 'aria-haspopup': 'dialog' },
    });
    how.addEventListener('click', () => {
      this.openManual();
    });
    this.foot.replaceChildren(
      h(
        'div',
        { class: 'dyno__units', attrs: { role: 'group', 'aria-label': 'Units' } },
        keyRow(
          'unit-power',
          'Power',
          POWER_UNITS.map((v) => ({ value: v, label: v })),
          u.power,
          (v) => {
            set('power', v);
          },
        ),
        keyRow(
          'unit-torque',
          'Torque',
          TORQUE_UNITS.map((v) => ({ value: v, label: torqueLabel(v) })),
          u.torque,
          (v) => {
            set('torque', v);
          },
        ),
        keyRow(
          'unit-pressure',
          'Boost',
          PRESSURE_UNITS.map((v) => ({ value: v, label: v })),
          u.pressure,
          (v) => {
            set('pressure', v);
          },
        ),
        keyRow(
          'unit-temperature',
          'Temperature',
          TEMPERATURE_UNITS.map((v) => ({ value: v, label: v })),
          u.temperature,
          (v) => {
            set('temperature', v);
          },
        ),
      ),
      how,
    );
  }

  private openManual(): void {
    if (!this.index) return;
    if (this.manualUnits !== this.state.units) {
      this.manualBody.replaceChildren(...buildManual(this.index, this.state.units));
      this.manualUnits = this.state.units;
    }
    this.manual.showModal();
  }

  private async run(): Promise<void> {
    const run = ++this.runs;
    this.root.dataset.busy = 'true';
    this.status.textContent = 'Running the dyno sweep.';
    try {
      const result = await this.client.simulate(
        this.state.carId,
        this.state.trimId,
        this.conditions(),
      );
      if (!result || run !== this.runs) return;
      this.report = result.report;
      this.root.dataset.ms = result.ms.toFixed(0);
      this.render();
    } catch (error) {
      if (run === this.runs) this.fail(error);
    } finally {
      if (run === this.runs) this.root.dataset.busy = 'false';
    }
  }

  private render(): void {
    const report = this.report;
    if (!report) return;
    const units = this.state.units;
    this.sheet = buildSheet(report, units);
    this.sheetHost.replaceChildren(this.sheet.root);
    this.sheet.drawChart();
    this.root.dataset.state = report.calibration.pass ? 'ready' : 'withheld';
    this.root.dataset.trim = `${report.carId}/${report.trimId}`;
    const summary = summaryText(report, units);
    this.summary.replaceChildren(
      summary.peaks,
      h('span', { class: 'dyno__summary-at', text: summary.at }),
    );
    this.status.textContent = `${report.title.make} ${report.title.model} ${report.title.trim}: ${summary.peaks}${summary.at}.`;
    this.publishSize();
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.root.dataset.state = 'error';
    this.summary.textContent = 'Stopped';
    this.sheetHost.replaceChildren(
      h(
        'div',
        { class: 'dyno__error', attrs: { role: 'alert' } },
        h('p', { class: 'dyno__error-title', text: 'The simulation stopped' }),
        h('p', { text: `${message} Pick another trim, or reload the page.` }),
      ),
    );
  }
}
