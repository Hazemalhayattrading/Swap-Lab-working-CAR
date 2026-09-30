import type {
  SimCar,
  SimCatalogue,
  SimEngine,
  SimFuel,
  SimTransmission,
  SimTrim,
  SimVariant,
} from '../data/sim-data';
import { ambientAir, standardPressure } from './atmosphere';
import { checkStock, type StockCheck } from './calibrate/check';
import { ratingConditions, type RatingConditions } from './calibrate/rating';
import { fitStockEngine, type StockFit } from './calibrate/stock-model';
import { drivetrainFor, type Drivetrain } from './drivetrain';
import { runDyno } from './dyno';
import type { Conditions, EngineModel } from './engine/model';
import { fuelFrom } from './fuel';
import { applyLimits, type LimitCheck, type LimitedRun } from './limits';
import { heatShares, heatSoak, stockCoolingSystem, type HeatSoakResult } from './thermal';
import { uncertaintyBand } from './uncertainty';

/**
 * What the user sets. Defaults (CLAUDE.md, owner 2026-09-30): 45 °C ambient in
 * Riyadh (about 600 m, 94.2 kPa in the standard atmosphere) on PG95. Relative
 * humidity 10 %: Riyadh's July day averages 8-15 % (docs/research/part2b), and
 * at 45 °C that is about 1 kPa of water vapour, the same the rating standards
 * assume, so humidity alone doesn't move the default numbers.
 */
export interface UserConditions {
  temperatureC: number;
  /** A preset from standards/locations.json, or `custom`. */
  location: string;
  /** m above sea level: the preset's own, or what the user typed for `custom`. */
  elevationM: number;
  relativeHumidity: number;
  /** A fuel from standards/fuels.json. */
  fuelId: string;
}

export const CUSTOM_LOCATION = 'custom';
export const DEFAULT_AMBIENT_C = 45;
export const DEFAULT_RELATIVE_HUMIDITY = 0.1;
/** The custom elevation input's range, m (the standard atmosphere's formula holds far beyond it). */
export const ELEVATION_RANGE_M = [-100, 3500] as const;

export function defaultConditions(catalogue: SimCatalogue): UserConditions {
  const location = catalogue.locations.find((l) => l.id === catalogue.defaultLocation);
  return {
    temperatureC: DEFAULT_AMBIENT_C,
    location: catalogue.defaultLocation,
    elevationM: location?.elevation ?? 0,
    relativeHumidity: DEFAULT_RELATIVE_HUMIDITY,
    fuelId: catalogue.defaultFuel,
  };
}

/** Ambient presets (BUILD_PROMPT 6.2). */
export const AMBIENT_PRESETS_C = [25, 35, 45, 50] as const;

/** Barometric pressure, Pa, where the user says the car is. */
export function pressureFor(input: UserConditions, catalogue: SimCatalogue): number {
  if (input.location !== CUSTOM_LOCATION) {
    const preset = catalogue.locations.find((l) => l.id === input.location);
    if (preset) return preset.pressure;
  }
  const [low, high] = ELEVATION_RANGE_M;
  const elevation = Math.min(high, Math.max(low, input.elevationM));
  return standardPressure(elevation, catalogue.atmosphere);
}

export function fuelChoice(input: UserConditions, catalogue: SimCatalogue): SimFuel {
  const fuel =
    catalogue.fuels.find((f) => f.id === input.fuelId) ??
    catalogue.fuels.find((f) => f.id === catalogue.defaultFuel);
  if (!fuel) throw new Error(`No fuel "${input.fuelId}"`);
  return fuel;
}

export interface TrimSimulation {
  car: SimCar;
  trim: SimTrim;
  engine: SimEngine;
  variant: SimVariant;
  transmission: SimTransmission;
  drivetrain: Drivetrain;
  rating: RatingConditions;
  fit: StockFit;
  /** The stock calibration gate, at the rating conditions. */
  calibration: StockCheck;
  /** The model at the rating conditions (what the calibration checks). */
  ratingRun: LimitedRun;
  /** The model at the user's conditions. */
  run: LimitedRun;
  conditions: Conditions;
  /** The fuel the user picked, as the catalogue lists it (availability, tune). */
  fuel: SimFuel;
  /** The fuel needs a tune (race fuel, E85): the model assumes one. */
  tuned: boolean;
  /** Uncertainty as a fraction of torque, per rpm of `run`. */
  band: number[];
  /** The 3-minute sustained drift session (BUILD_PROMPT 6.2) at the user's ambient. */
  heatSoak: HeatSoakResult;
}

export function conditionsFrom(input: UserConditions, catalogue: SimCatalogue): Conditions {
  return {
    air: ambientAir({
      temperatureC: input.temperatureC,
      pressureKPa: pressureFor(input, catalogue) / 1000,
      relativeHumidity: input.relativeHumidity,
    }),
    fuel: fuelFrom(fuelChoice(input, catalogue), catalogue.constants),
  };
}

const minutes = (s: number): string =>
  `${String(Math.floor(s / 60))}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** The heat-soak result as the limits list shows it. */
function coolingCheck(result: HeatSoakResult): LimitCheck {
  const c = (k: number) => `${String(Math.round(k - 273.15))} °C`;
  const peaks = `coolant peaks at ${c(result.peakCoolant)} (limit ${c(result.limits.coolant)}), oil at ${c(result.peakOil)} (limit ${c(result.limits.oil)})`;
  return {
    id: 'cooling',
    name: 'Cooling (3-minute drift session)',
    status: result.pass ? 'ok' : 'over-rating',
    utilisation: Math.max(
      (result.peakCoolant - result.ambient) / (result.limits.coolant - result.ambient),
      (result.peakOil - result.ambient) / (result.limits.oil - result.ambient),
    ),
    detail: result.pass
      ? `The factory cooling holds: ${peaks}.`
      : `The ${result.failedOn ?? 'coolant'} passes its limit at ${minutes(result.failedAt ?? 0)} into the session; ${peaks}. Cooling parts (Phase 3) are where this is fixed.`,
  };
}

/**
 * The drift session: the factory cooling system (sized from the engine's
 * rated fuel power, thermal.ts) against the heat of this run's power peak.
 */
function runHeatSoak(
  engine: SimEngine,
  ratingRun: LimitedRun,
  ratingLhv: number,
  run: LimitedRun,
  conditions: Conditions,
  catalogue: SimCatalogue,
): HeatSoakResult {
  const k = catalogue.constants;
  const at = (r: LimitedRun) => r.points.find((p) => p.rpm === r.peakPower.rpm);
  const rated = (at(ratingRun)?.fuelFlow ?? 0) * ratingLhv;
  const system = stockCoolingSystem(engine, rated, k);
  const load = {
    fuelPower: (at(run)?.fuelFlow ?? 0) * conditions.fuel.lhv,
    ...heatShares(engine, k),
  };
  return heatSoak(system, load, conditions.air.temperature, k);
}

/** Stock fits per engine variant; they don't depend on the user's conditions. */
export class FitCache {
  private readonly fits = new Map<string, StockFit>();

  get(
    catalogue: SimCatalogue,
    engine: SimEngine,
    variant: SimVariant,
    rating: RatingConditions,
  ): StockFit {
    const key = `${engine.id}/${variant.id}`;
    let fit = this.fits.get(key);
    if (!fit) {
      const vePrior = this.sisterVeLevel(catalogue, engine, variant);
      fit = fitStockEngine(
        engine,
        variant,
        rating,
        catalogue.constants,
        vePrior !== undefined ? { vePrior } : {},
      );
      this.fits.set(key, fit);
    }
    return fit;
  }

  /**
   * A turbo variant without a published stock boost starts from the VE level
   * its engine's published-boost variants fit to: the ports, cams and turbos
   * are largely shared, the boost is what the markets differ in. Undefined when
   * no sister variant has one (the generic prior then applies).
   */
  private sisterVeLevel(
    catalogue: SimCatalogue,
    engine: SimEngine,
    variant: SimVariant,
  ): number | undefined {
    if (variant.induction === 'naturally-aspirated' || variant.boost) return undefined;
    const levels = engine.variants
      .filter((v) => v.induction !== 'naturally-aspirated' && v.boost !== undefined)
      .map((v) => this.get(catalogue, engine, v, ratingConditions(catalogue, v)).boost?.veLevel)
      .filter((x): x is number => x !== undefined);
    return levels.length > 0 ? levels.reduce((s, x) => s + x, 0) / levels.length : undefined;
  }
}

export function lookup(catalogue: SimCatalogue, carId: string, trimId: string) {
  const car = catalogue.cars.find((c) => c.id === carId);
  const trim = car?.trims.find((t) => t.id === trimId);
  if (!car || !trim) throw new Error(`No trim ${carId}/${trimId}`);
  const engine = catalogue.engines.find((e) => e.id === trim.engine.id);
  const variant = engine?.variants.find((v) => v.id === trim.engine.variant);
  const transmission = car.transmissions.find((t) => t.id === trim.transmission);
  if (!engine || !variant || !transmission) throw new Error(`Broken trim ${carId}/${trimId}`);
  return { car, trim, engine, variant, transmission };
}

export function simulateTrim(
  catalogue: SimCatalogue,
  carId: string,
  trimId: string,
  input: UserConditions = defaultConditions(catalogue),
  cache: FitCache = new FitCache(),
): TrimSimulation {
  const k = catalogue.constants;
  const { car, trim, engine, variant, transmission } = lookup(catalogue, carId, trimId);
  const rating = ratingConditions(catalogue, variant);
  const fit = cache.get(catalogue, engine, variant, rating);
  const drivetrain = drivetrainFor(car.layout, transmission, k);
  const limitOptions = { engine, variant, drivetrain, k };

  const ratingRun = applyLimits(runDyno(fit.model, fit.conditions, k), limitOptions);
  const calibration = checkStock(fit, variant, ratingRun);
  const conditions = conditionsFrom(input, catalogue);
  const fuel = fuelChoice(input, catalogue);
  // Race fuel and E85 need a tune; the model assumes one, with timing at the
  // knock limit on that fuel. The factory ECU otherwise keeps its own map.
  // A tuned rotary also runs leaner than its factory map (src/sim/build.ts).
  const model: EngineModel = fuel.needsTune
    ? {
        ...fit.model,
        ignition: 'knock-limited',
        ...(fit.model.rotary && fit.model.induction.kind === 'turbo'
          ? { lambda: k['wot-lambda-rotary-tuned'] }
          : {}),
      }
    : fit.model;
  const pull = applyLimits(runDyno(model, conditions, k), limitOptions);
  const heat = runHeatSoak(engine, ratingRun, fit.conditions.fuel.lhv, pull, conditions, catalogue);
  // applyLimits leaves the cooling check to the heat-soak test.
  const run: LimitedRun = {
    ...pull,
    checks: pull.checks.map((c) => (c.id === 'cooling' ? coolingCheck(heat) : c)),
  };

  const calibrationError = Math.max(
    Math.abs(calibration.torque.error),
    Math.abs(calibration.power.error),
    ...(calibration.curve ?? []).map((c) => Math.abs(c.error)),
  );
  const band = uncertaintyBand(
    {
      grid: fit.model.grid,
      curve: fit.curve,
      boosted: variant.induction !== 'naturally-aspirated',
      assumedStandard: rating.assumed,
      calibrationError,
      intakeDelta: run.points.map(
        (p, i) =>
          p.chargeTemperature - (ratingRun.points[i]?.chargeTemperature ?? p.chargeTemperature),
      ),
      octaneDelta: conditions.fuel.ron - rating.fuel.ron,
    },
    k,
  );
  return {
    car,
    trim,
    engine,
    variant,
    transmission,
    drivetrain,
    rating,
    fit,
    calibration,
    ratingRun,
    run,
    conditions,
    fuel,
    tuned: fuel.needsTune,
    band,
    heatSoak: heat,
  };
}
