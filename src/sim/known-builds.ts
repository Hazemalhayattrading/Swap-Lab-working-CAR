import type { SimCatalogue, SimKnownBuild } from '../data/sim-data';
import { ambientAir, standardPressure, type Atmosphere } from './atmosphere';
import { ratingConditions } from './calibrate/rating';
import { applyBuild } from './build';
import { correctionAtmosphere, dynoReading } from './dyno-correction';
import { drivetrainFor } from './drivetrain';
import { runDyno } from './dyno';
import { fuelFrom, pumpGasoline, type Fuel } from './fuel';
import { applyLimits } from './limits';
import { lookup, type FitCache } from './simulate';

/**
 * The known-build calibration (BUILD_PROMPT 6.5): a documented real build run
 * through the model, then turned into what its own dyno would have printed
 * (dyno type and correction standard), and compared with the sheet.
 */
export const KNOWN_BUILD_TOLERANCE = 0.1;

export interface KnownBuildResult {
  build: SimKnownBuild;
  /** W at the wheels as the build's own dyno would print it. */
  predicted: number;
  /** W at the wheels as printed. */
  measured: number;
  /** (predicted - measured) / measured */
  error: number;
  pass: boolean;
  detail: {
    /** W, crank, peak. */
    crankPower: number;
    crankPowerRpm: number;
    drivetrainEfficiency: number;
    readingFactor: number;
    correctionFactor: number;
    /** Whether the model ran at the sheet's own test-day air or at its correction's reference. */
    air: 'test-day' | 'correction-reference';
    /** Pa gauge at peak power (boosted engines). */
    boostAtPeak?: number;
    /** What held the boost at peak power (turbo engines). */
    boostLimit?: string;
    /** Pa gauge, the most boost the model holds anywhere in the sweep (boosted engines). */
    peakBoost?: number;
    sparkRetardAtPeak: number;
  };
}

function fuelOf(catalogue: SimCatalogue, build: SimKnownBuild): Fuel {
  const f = build.spec.fuel;
  const k = catalogue.constants;
  if (f.id) {
    const choice = catalogue.fuels.find((c) => c.id === f.id);
    if (!choice) throw new Error(`${build.id}: no fuel "${f.id}"`);
    return { ...fuelFrom(choice, k), ron: f.ron };
  }
  return pumpGasoline(f.ron, k);
}

function testAir(catalogue: SimCatalogue, build: SimKnownBuild): Atmosphere | undefined {
  const c = build.result.conditions;
  if (!c) return undefined;
  return ambientAir({
    temperatureC: c.temperature - 273.15,
    pressureKPa: c.pressure / 1000,
    // A sheet without humidity: the rating standards' 1 kPa of vapour, as the model assumes elsewhere.
    relativeHumidity: c.relativeHumidity ?? catalogue.constants['dyno-default-relative-humidity'],
  });
}

export function simulateKnownBuild(
  catalogue: SimCatalogue,
  build: SimKnownBuild,
  cache: FitCache,
): KnownBuildResult {
  const k = catalogue.constants;
  const { car, engine, variant, transmission } = lookup(catalogue, build.carId, build.trimId);
  const rating = ratingConditions(catalogue, variant);
  const fit = cache.get(catalogue, engine, variant, rating);
  const dyno = catalogue.dynos.find((d) => d.id === build.result.dyno);
  const correction = catalogue.corrections.find((c) => c.id === build.result.correction);
  if (!dyno || !correction) throw new Error(`${build.id}: unknown dyno or correction`);

  const dayAir = testAir(catalogue, build);
  const referenceAir = correctionAtmosphere(correction, 1000);
  const air = dayAir ?? referenceAir;
  if (!air) {
    throw new Error(`${build.id}: an uncorrected sheet needs its test-day air to be compared.`);
  }
  const fuel = fuelOf(catalogue, build);
  const model = applyBuild(
    fit,
    build.spec,
    {
      air,
      ...(build.result.powerRpm !== undefined ? { peakPowerRpm: build.result.powerRpm } : {}),
    },
    k,
  );
  const drivetrain = drivetrainFor(car.layout, transmission, k);
  const run = applyLimits(runDyno(model, { air, fuel }, k), { engine, variant, drivetrain, k });
  const peak = run.points.find((p) => p.rpm === run.peakPower.rpm);
  const wheel = run.peakPower.value * drivetrain.efficiency;
  const reading = dynoReading(wheel, dyno, correction, air);
  const measured = build.result.wheelPower.value;
  const error = (reading.reading - measured) / measured;
  return {
    build,
    predicted: reading.reading,
    measured,
    error,
    pass: Math.abs(error) <= KNOWN_BUILD_TOLERANCE,
    detail: {
      crankPower: run.peakPower.value,
      crankPowerRpm: run.peakPower.rpm,
      drivetrainEfficiency: drivetrain.efficiency,
      readingFactor: reading.readingFactor,
      correctionFactor: reading.correctionFactor,
      air: dayAir ? 'test-day' : 'correction-reference',
      ...(peak && variant.induction !== 'naturally-aspirated' ? { boostAtPeak: peak.boost } : {}),
      ...(peak?.supercharger ? { boostAtPeak: peak.boost } : {}),
      ...(peak?.turbo ? { boostLimit: peak.turbo.limit } : {}),
      ...(variant.induction !== 'naturally-aspirated' || build.spec.supercharger
        ? { peakBoost: Math.max(...run.points.map((p) => p.boost)) }
        : {}),
      sparkRetardAtPeak: peak?.sparkRetard ?? 0,
    },
  };
}

/** A standard-atmosphere pressure for a dyno whose sheet gives its elevation, not its barometer. */
export function pressureAtElevation(catalogue: SimCatalogue, elevation: number): number {
  return standardPressure(elevation, catalogue.atmosphere);
}
