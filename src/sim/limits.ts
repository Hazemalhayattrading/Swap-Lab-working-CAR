import type { ModelConstants, SimEngine, SimReportedLimit, SimVariant } from '../data/sim-data';
import type { Drivetrain } from './drivetrain';
import { peaks, type DynoRun } from './dyno';
import type { OperatingPoint } from './engine/model';

/**
 * The limits that cap a build's output (BUILD_PROMPT 6.1), each reported as a
 * named check.
 *
 * - Physical limits change the curve where they bind: injector duty above the
 *   limit (fuel-limited, as a sensible tune would hold it), and a compressor
 *   pushed into surge, choke or overspeed (the boost solver already pulls the
 *   boost back to the map's edge; this names it).
 * - Part ratings (rods, pistons, clutch, gearbox, diff and axles) are flagged
 *   when exceeded but don't bend the curve: the engine still makes the power,
 *   the part just isn't rated for it. Most stock parts have no rating on file
 *   yet (the Phase 3 parts catalogue adds them), and the check says so.
 * - Octane: the spark retard knock forces, and where a factory ECU has to
 *   hold the boost down because the fuel can't take more (engine/model.ts).
 * - Cooling is the 3-minute drift session (thermal.ts); simulate.ts fills it in.
 */
export type LimitId =
  | 'injector-duty'
  | 'fuel-pump'
  | 'fuel-octane'
  | 'compressor-surge'
  | 'compressor-choke'
  | 'turbo-overspeed'
  | 'internals'
  | 'clutch'
  | 'gearbox'
  | 'diff-axle'
  | 'cooling';

export type LimitStatus = 'ok' | 'bottleneck' | 'over-rating' | 'no-data' | 'not-modelled';

export interface LimitCheck {
  id: LimitId;
  name: string;
  status: LimitStatus;
  /** Highest share of the limit used over the sweep. */
  utilisation?: number;
  /** rpm range where the limit binds or is exceeded. */
  rpm?: [number, number];
  detail: string;
}

export interface LimitedRun extends DynoRun {
  checks: LimitCheck[];
}

function rangeOf(points: readonly OperatingPoint[]): [number, number] | undefined {
  if (points.length === 0) return undefined;
  return [points[0]?.rpm ?? 0, points[points.length - 1]?.rpm ?? 0];
}

function pct(x: number): string {
  return `${String(Math.round(x * 100))} %`;
}

const num = (x: number): string => Math.round(x).toLocaleString('en-US');
const rpmText = (rpm: number): string => `${num(rpm)} rpm`;

function capInjectors(
  points: OperatingPoint[],
  engine: SimEngine,
  variant: SimVariant,
  k: ModelConstants,
): LimitCheck {
  const limit = k['injector-duty-limit'];
  if (!variant.injectorFlow) {
    return {
      id: 'injector-duty',
      name: 'Injector duty',
      status: 'no-data',
      detail: `No injector flow is on file for the ${engine.code} (${variant.name}), so duty can't be checked.`,
    };
  }
  let worst = 0;
  let worstRpm = 0;
  const capped: OperatingPoint[] = [];
  points.forEach((p, i) => {
    const duty = p.injectorDuty ?? 0;
    if (duty > worst) {
      worst = duty;
      worstRpm = p.rpm;
    }
    if (duty > limit) {
      const share = limit / duty;
      const indicated = p.indicatedTorque * share;
      const torque = indicated - p.frictionTorque - p.pumpingTorque - p.driveTorque;
      const next: OperatingPoint = {
        ...p,
        indicatedTorque: indicated,
        torque,
        power: (torque * 2 * Math.PI * p.rpm) / 60,
        airflow: p.airflow * share,
        fuelFlow: p.fuelFlow * share,
        injectorDuty: limit,
      };
      points[i] = next;
      capped.push(next);
    }
  });
  const range = rangeOf(capped);
  return {
    id: 'injector-duty',
    name: 'Injector duty',
    status: capped.length > 0 ? 'bottleneck' : 'ok',
    utilisation: worst / limit,
    ...(range ? { rpm: range } : {}),
    detail:
      capped.length > 0
        ? `The injectors run out: duty would reach ${pct(worst)} at ${rpmText(worstRpm)}, so fuel (and power) is held at ${pct(limit)} duty.`
        : `Peak duty ${pct(worst)} at ${rpmText(worstRpm)}, under the ${pct(limit)} limit.`,
  };
}

function compressorChecks(points: readonly OperatingPoint[]): LimitCheck[] {
  if (!points.some((p) => p.turbo)) return [];
  const by = (limit: string) => points.filter((p) => p.turbo?.limit === limit);
  const check = (
    id: LimitId,
    name: string,
    limit: string,
    words: string,
    utilisation: (p: OperatingPoint) => number,
  ): LimitCheck => {
    const hits = by(limit);
    const range = rangeOf(hits);
    const worst = Math.max(0, ...points.map(utilisation));
    return {
      id,
      name,
      status: hits.length > 0 ? 'bottleneck' : 'ok',
      utilisation: worst,
      ...(range ? { rpm: range } : {}),
      detail:
        hits.length > 0 && range
          ? `${words} from ${num(range[0])} to ${rpmText(range[1])}; boost is held back there.`
          : 'Inside the compressor map across the sweep.',
    };
  };
  return [
    check('compressor-surge', 'Compressor surge', 'surge', 'The compressor would surge', (p) =>
      p.turbo ? Math.max(0, 1 - p.turbo.map.x) : 0,
    ),
    check(
      'compressor-choke',
      'Compressor choke',
      'choke',
      'The compressor chokes',
      (p) => p.turbo?.map.x ?? 0,
    ),
    check(
      'turbo-overspeed',
      'Turbo speed',
      'overspeed',
      'The compressor hits the top of its map',
      (p) => p.turbo?.map.y ?? 0,
    ),
  ];
}

function octaneCheck(points: readonly OperatingPoint[]): LimitCheck {
  const held = points.filter((p) => p.turbo?.limit === 'octane');
  const worst = points.reduce<OperatingPoint | undefined>(
    (a, p) => (!a || p.sparkRetard > a.sparkRetard ? p : a),
    undefined,
  );
  const range = rangeOf(held);
  const retard = worst ? `${String(Math.round(worst.sparkRetard))}°` : '0°';
  return {
    id: 'fuel-octane',
    name: 'Fuel octane',
    status: held.length > 0 ? 'bottleneck' : 'ok',
    ...(range ? { rpm: range } : {}),
    detail:
      held.length > 0 && range
        ? `On this fuel the factory ECU runs out of knock retard and holds the boost down from ${num(range[0])} to ${rpmText(range[1])}.`
        : `Spark timing sits up to ${retard} behind best-torque timing${worst ? ` (at ${rpmText(worst.rpm)})` : ''} to stay out of knock.`,
  };
}

function describeLimit(l: SimReportedLimit): string {
  const unit =
    l.quantity === 'rpm'
      ? rpmText(l.value.value)
      : l.quantity === 'torque'
        ? `${String(Math.round(l.value.value))} N·m`
        : `${String(Math.round(l.value.value / 745.69987158227))} hp ${l.quantity === 'wheel-power' ? 'at the wheels' : 'at the crank'}`;
  return `${l.component.replace(/-/g, ' ')}: about ${unit} (${l.value.confidence})`;
}

function internalsCheck(run: DynoRun, engine: SimEngine, drivetrain: Drivetrain): LimitCheck {
  if (engine.reportedLimits.length === 0) {
    return {
      id: 'internals',
      name: 'Rods, pistons and bottom end',
      status: 'no-data',
      detail: `No reported strength limit is on file for the ${engine.code}.`,
    };
  }
  const endRpm = run.points[run.points.length - 1]?.rpm ?? 0;
  const demand = (l: SimReportedLimit) =>
    l.quantity === 'crank-power'
      ? run.peakPower.value
      : l.quantity === 'wheel-power'
        ? run.peakPower.value * drivetrain.efficiency
        : l.quantity === 'torque'
          ? run.peakTorque.value
          : endRpm;
  let worst = engine.reportedLimits[0];
  let worstShare = 0;
  for (const l of engine.reportedLimits) {
    const share = demand(l) / l.value.value;
    if (share > worstShare) {
      worstShare = share;
      worst = l;
    }
  }
  if (!worst) throw new Error('unreachable');
  return {
    id: 'internals',
    name: 'Rods, pistons and bottom end',
    status: worstShare > 1 ? 'over-rating' : 'ok',
    utilisation: worstShare,
    detail: `Closest reported limit: ${describeLimit(worst)}, ${pct(worstShare)} used. Reported limits are builder guidance, not failure tests: ${worst.context}`,
  };
}

export function applyLimits(
  run: DynoRun,
  opts: { engine: SimEngine; variant: SimVariant; drivetrain: Drivetrain; k: ModelConstants },
): LimitedRun {
  const points = run.points.slice();
  const injectors = capInjectors(points, opts.engine, opts.variant, opts.k);
  const limited = { points, ...peaks(points) };
  const checks: LimitCheck[] = [
    injectors,
    {
      id: 'fuel-pump',
      name: 'Fuel pump',
      status: 'no-data',
      detail: 'No stock fuel-pump flow is on file yet; pump ratings come with the parts catalogue.',
    },
    octaneCheck(points),
    ...compressorChecks(points),
    internalsCheck(limited, opts.engine, opts.drivetrain),
    {
      id: 'clutch',
      name: 'Clutch',
      status: 'no-data',
      detail: 'No torque rating is on file for the stock clutch yet (parts catalogue, Phase 3).',
    },
    {
      id: 'gearbox',
      name: 'Gearbox',
      status: 'no-data',
      detail: 'No torque rating is on file for the stock gearbox yet (parts catalogue, Phase 3).',
    },
    {
      id: 'diff-axle',
      name: 'Diff and axles',
      status: 'no-data',
      detail:
        'No torque rating is on file for the stock diff and axles yet (parts catalogue, Phase 3).',
    },
    {
      id: 'cooling',
      name: 'Cooling',
      status: 'not-modelled',
      detail: 'The heat-soak test runs with the user’s conditions (simulate.ts).',
    },
  ];
  return { ...limited, checks };
}
