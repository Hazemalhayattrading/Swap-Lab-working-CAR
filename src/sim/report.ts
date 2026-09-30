import type { FuelAvailability, SimCatalogue, SimTransmission, SimWeight } from '../data/sim-data';
import type { StockCheck } from './calibrate/check';
import type { LimitCheck } from './limits';
import { CUSTOM_LOCATION, pressureFor, type TrimSimulation, type UserConditions } from './simulate';
import type { HeatSoakSample } from './thermal';

/**
 * What the dyno sheet shows, as plain data: the worker posts this to the
 * page. SI units throughout (W, N·m, Pa gauge, K); the UI converts for
 * display. Model internals (fitted tables, turbo sizing) stay in the worker.
 */
export interface DynoReport {
  carId: string;
  trimId: string;
  title: {
    make: string;
    model: string;
    chassis: string;
    trim: string;
    market: string;
    period: string;
    body: string;
    gearbox: string;
  };
  engine: {
    code: string;
    variant: string;
    induction: string;
    turbos: string[];
    displacementCc: number;
    rotary: boolean;
  };
  weight: SimWeight;
  rating: {
    standard: string;
    standardName: string;
    /** The figure's own label; `unknown` means the standard is assumed. */
    printedStandard: string;
    assumed: boolean;
    temperatureK: number;
    pressurePa: number;
    pressureBasis: 'total' | 'dry-air';
    fuelRon: number;
    printed: { power: string; torque: string };
  };
  calibration: StockCheck;
  conditions: UserConditions;
  /** Where the sweep ran and on what, as the sheet's header states it. */
  environment: {
    locationName: string;
    /** "about 600 m", or the custom elevation. */
    locationLabel: string;
    elevationM: number;
    /** Pa, barometric. */
    pressurePa: number;
    fuel: {
      id: string;
      name: string;
      ron: number;
      kind: 'pump-gasoline' | 'race-gasoline' | 'e85';
      availability: { status: FuelAvailability; summary: string };
      /** The model assumes a tune for this fuel. */
      tuned: boolean;
    };
    /** What the air and fuel do to this engine, in plain words. */
    notes: string[];
  };
  curve: {
    source: 'published-curve' | 'peaks';
    anchors: number[];
    spoolRpm?: number;
    boostSource?: 'published' | 'inferred';
    changeoverRpm?: number;
  };
  drivetrain: { efficiency: number; gear: number; type: string };
  /**
   * The simulated numbers. Left out when the stock check fails (CLAUDE.md
   * rule 3), so the page never receives numbers it may not show.
   */
  channels?: {
    rpm: number[];
    /** N·m, crank */
    torque: number[];
    /** W, crank */
    power: number[];
    /** W, wheels (estimated drivetrain loss) */
    wheelPower: number[];
    /** Fraction of torque, per rpm. */
    band: number[];
    /** Pa gauge (boosted engines only). */
    boost?: number[];
    /** K */
    chargeTemperature: number[];
    /** K */
    exhaustTemperature: number[];
    afr: number[];
    /** 0-1 (only where injector flow is on file). */
    injectorDuty?: number[];
    sparkRetard: number[];
    /** The model at the rating conditions, for comparison. */
    ratingTorque: number[];
    ratingPower: number[];
  };
  peaks?: {
    torque: { value: number; rpm: number };
    power: { value: number; rpm: number };
    wheelPower: { value: number; rpm: number };
    boost?: { value: number; rpm: number };
  };
  limits?: LimitCheck[];
  /** The 3-minute drift session; withheld with the other numbers when the stock check fails. */
  heatSoak?: {
    pass: boolean;
    samples: HeatSoakSample[];
    peakCoolant: number;
    peakOil: number;
    failedAt?: number;
    failedOn?: 'coolant' | 'oil';
    limits: { coolant: number; oil: number };
    /** K */
    ambient: number;
    /** s */
    duration: number;
    /** Share of full load the session swings between. */
    load: [number, number];
    /** m/s through the radiator while sliding. */
    faceVelocity: number;
  };
  /** Plain-language list of the inputs that are modelled or assumed rather than published. */
  estimates: string[];
}

/** A report whose stock check passed, so it carries the simulated numbers. */
export type PassedReport = DynoReport &
  Required<Pick<DynoReport, 'channels' | 'peaks' | 'limits' | 'heatSoak'>>;

export function hasNumbers(report: DynoReport): report is PassedReport {
  return (
    report.calibration.pass &&
    report.channels !== undefined &&
    report.peaks !== undefined &&
    report.limits !== undefined &&
    report.heatSoak !== undefined
  );
}

const INDUCTION: Record<string, string> = {
  'naturally-aspirated': 'Naturally aspirated',
  'single-turbo': 'Single turbo',
  'twin-turbo-sequential': 'Sequential twin turbo',
  'twin-turbo-parallel': 'Parallel twin turbo',
};

const GEARBOX: Record<SimTransmission['type'], string> = {
  manual: 'manual',
  automatic: 'automatic',
  'automated-manual': 'automated manual',
};

/** "6-speed manual": the gearbox as the pickers and the sheet name it. */
export function gearboxLabel(t: SimTransmission): string {
  return `${String(t.ratios.length)}-speed ${GEARBOX[t.type]}`;
}

function environmentNotes(sim: TrimSimulation, pressure: number): string[] {
  const notes: string[] = [];
  const kPa = `${(pressure / 1000).toFixed(1)} kPa`;
  const boosted = sim.variant.induction !== 'naturally-aspirated';
  if (!boosted) {
    notes.push(
      `Naturally aspirated: at ${kPa} the engine breathes thinner air, and power falls with it.`,
    );
  } else {
    const start = sim.fit.curve.start;
    const short = sim.run.points.filter(
      (p) =>
        p.rpm >= start &&
        p.turbo !== undefined &&
        (p.turbo.limit === 'overspeed' || p.turbo.limit === 'choke' || p.turbo.limit === 'surge'),
    );
    const first = short[0];
    notes.push(
      first
        ? `At ${kPa} the boost control aims for the same absolute pressure as at sea level, so the turbo works harder; it runs out of headroom from ${first.rpm.toLocaleString('en-US')} rpm and boost falls there.`
        : `At ${kPa} the boost control aims for the same absolute pressure as at sea level, and the turbo has the headroom to hold it: more boost on the gauge, the same air in the engine.`,
    );
  }
  if (sim.run.points.some((p) => p.turbo?.limit === 'octane')) {
    notes.push(
      `${sim.fuel.name} is below what the factory calibration was rated on, and the ECU holds the boost down where knock retard runs out.`,
    );
  }
  if (sim.tuned) {
    notes.push(
      `${sim.fuel.name} needs a tune; the model assumes one, with timing at the knock limit on this fuel and the factory boost.`,
    );
  }
  return notes;
}

export function toReport(
  sim: TrimSimulation,
  input: UserConditions,
  catalogue: SimCatalogue,
): DynoReport {
  const { car, trim, variant, engine, run, ratingRun, fit, rating } = sim;
  const k = catalogue.constants;
  const pressure = pressureFor(input, catalogue);
  const preset =
    input.location === CUSTOM_LOCATION
      ? undefined
      : catalogue.locations.find((l) => l.id === input.location);
  const points = run.points;
  const boosted = variant.induction !== 'naturally-aspirated';
  const wheelPower = points.map((p) => p.power * sim.drivetrain.efficiency);
  let wheelPeak = { value: -Infinity, rpm: 0 };
  wheelPower.forEach((w, i) => {
    if (w > wheelPeak.value) wheelPeak = { value: w, rpm: points[i]?.rpm ?? 0 };
  });
  let boostPeak: { value: number; rpm: number } | undefined;
  if (boosted) {
    boostPeak = { value: -Infinity, rpm: 0 };
    for (const p of points)
      if (p.boost > boostPeak.value) boostPeak = { value: p.boost, rpm: p.rpm };
  }

  const estimates: string[] = [];
  if (rating.assumed) {
    estimates.push(
      `The maker doesn't say which standard the ${variant.rating.printed.power} figure follows; the model assumes ${rating.standard.name}.`,
    );
  }
  if (fit.curve.source === 'peaks') {
    estimates.push(
      'Only the peak figures are published, so the curve between and beyond them is the model’s shape (the band widens there).',
    );
  }
  if (fit.boost?.source === 'published') {
    estimates.push(
      'The stock boost is published as a single figure; the boost curve’s shape from spool to redline is the model’s.',
    );
  }
  if (fit.boost?.source === 'inferred') {
    estimates.push(
      `No stock boost is published; the model infers ${(fit.boost.peak / 1e5).toFixed(2)} bar from the rated output.`,
    );
  }
  if (fit.boost?.changeoverRpm !== undefined) {
    estimates.push(
      `The second turbo's changeover rpm is a model assumption (${String(fit.boost.changeoverRpm)} rpm).`,
    );
  }
  if (!variant.redline && !variant.revLimit) {
    estimates.push(
      `No redline is published; the sweep stops at ${String(points[points.length - 1]?.rpm ?? 0)} rpm.`,
    );
  }
  estimates.push(
    'No maker publishes its radiator’s capacity: the heat-soak test sizes the factory cooling by rule (it holds 105 °C at full power at top speed on a 40 °C day) and assumes 3 m/s of air through the radiator while sliding.',
  );
  if (sim.fuel.availability.status !== 'pump-nationwide') {
    estimates.push(`${sim.fuel.name}: ${sim.fuel.availability.summary}`);
  }
  if (trim.weight.basis === 'unstated') {
    estimates.push('The source doesn’t say what the curb weight includes (driver or not).');
  }
  for (const [name, value] of [
    ['power', variant.rating.power],
    ['power rpm', variant.rating.powerRpm],
    ['torque', variant.rating.torque],
    ['torque rpm', variant.rating.torqueRpm],
  ] as const) {
    if (value.confidence === 'estimated')
      estimates.push(`The factory ${name} figure is itself an estimate.`);
  }

  // CLAUDE.md rule 3: a trim that fails its stock check gets no simulated numbers.
  const numbers: Partial<Pick<PassedReport, 'channels' | 'peaks' | 'limits' | 'heatSoak'>> = sim
    .calibration.pass
    ? {
        channels: {
          rpm: points.map((p) => p.rpm),
          torque: points.map((p) => p.torque),
          power: points.map((p) => p.power),
          wheelPower,
          band: sim.band,
          ...(boosted ? { boost: points.map((p) => p.boost) } : {}),
          chargeTemperature: points.map((p) => p.chargeTemperature),
          exhaustTemperature: points.map((p) => p.exhaustTemperature),
          afr: points.map((p) => p.afr),
          ...(points.every((p) => p.injectorDuty !== undefined)
            ? { injectorDuty: points.map((p) => p.injectorDuty ?? 0) }
            : {}),
          sparkRetard: points.map((p) => p.sparkRetard),
          ratingTorque: ratingRun.points.map((p) => p.torque),
          ratingPower: ratingRun.points.map((p) => p.power),
        },
        peaks: {
          torque: run.peakTorque,
          power: run.peakPower,
          wheelPower: wheelPeak,
          ...(boostPeak ? { boost: boostPeak } : {}),
        },
        limits: run.checks,
        heatSoak: {
          pass: sim.heatSoak.pass,
          samples: sim.heatSoak.samples,
          peakCoolant: sim.heatSoak.peakCoolant,
          peakOil: sim.heatSoak.peakOil,
          ...(sim.heatSoak.failedAt !== undefined && sim.heatSoak.failedOn
            ? { failedAt: sim.heatSoak.failedAt, failedOn: sim.heatSoak.failedOn }
            : {}),
          limits: sim.heatSoak.limits,
          ambient: sim.heatSoak.ambient,
          duration: k['drift-duration'],
          load: [k['drift-load-low'], k['drift-load-high']],
          faceVelocity: k['drift-face-velocity'],
        },
      }
    : {};

  const transmission = sim.transmission;
  return {
    carId: car.id,
    trimId: trim.id,
    title: {
      make: car.make,
      model: car.model,
      chassis: car.chassis,
      trim: trim.name,
      market: trim.market,
      period: `${trim.period.from}${trim.period.to ? ` to ${trim.period.to}` : ' on'}`,
      body: trim.bodyStyle,
      gearbox: gearboxLabel(transmission),
    },
    engine: {
      code: engine.code,
      variant: variant.name,
      induction: INDUCTION[variant.induction] ?? variant.induction,
      turbos: variant.turbos.map((t) => `${String(t.count)} x ${t.model}`),
      displacementCc: engine.displacement.value,
      rotary: engine.layout === 'rotary',
    },
    weight: trim.weight,
    rating: {
      standard: rating.standard.id,
      standardName: rating.standard.name,
      printedStandard: rating.printedStandard,
      assumed: rating.assumed,
      temperatureK: rating.standard.temperature,
      pressurePa: rating.standard.pressure,
      pressureBasis: rating.standard.pressureBasis,
      fuelRon: rating.fuel.ron,
      printed: variant.rating.printed,
    },
    calibration: sim.calibration,
    conditions: input,
    environment: {
      locationName: preset?.name ?? 'Custom',
      locationLabel: preset?.label ?? `${Math.round(input.elevationM).toLocaleString('en-US')} m`,
      elevationM: preset?.elevation ?? input.elevationM,
      pressurePa: pressure,
      fuel: {
        id: sim.fuel.id,
        name: sim.fuel.name,
        ron: sim.fuel.ron,
        kind: sim.fuel.kind,
        availability: sim.fuel.availability,
        tuned: sim.tuned,
      },
      notes: environmentNotes(sim, pressure),
    },
    curve: {
      source: fit.curve.source,
      anchors: fit.curve.anchors,
      ...(boosted ? { spoolRpm: fit.curve.start } : {}),
      ...(fit.boost
        ? {
            boostSource: fit.boost.source,
            ...(fit.boost.changeoverRpm !== undefined
              ? { changeoverRpm: fit.boost.changeoverRpm }
              : {}),
          }
        : {}),
    },
    drivetrain: {
      efficiency: sim.drivetrain.efficiency,
      gear: sim.drivetrain.gear,
      type: sim.drivetrain.type,
    },
    ...numbers,
    estimates,
  };
}
