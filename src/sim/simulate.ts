import type {
  SimCar,
  SimCatalogue,
  SimEngine,
  SimTransmission,
  SimTrim,
  SimVariant,
} from '../data/sim-data';
import { ambientAir } from './atmosphere';
import { checkStock, type StockCheck } from './calibrate/check';
import { ratingConditions, type RatingConditions } from './calibrate/rating';
import { fitStockEngine, type StockFit } from './calibrate/stock-model';
import { drivetrainFor, type Drivetrain } from './drivetrain';
import { runDyno } from './dyno';
import type { Conditions } from './engine/model';
import { pumpGasoline } from './fuel';
import { applyLimits, type LimitedRun } from './limits';
import { uncertaintyBand } from './uncertainty';

/**
 * What the user sets. Defaults (CLAUDE.md): 45 °C ambient, 95 RON; sea-level
 * pressure; 10 % relative humidity, about 1 kPa of water vapour at 45 °C, the
 * same vapour pressure the rating standards assume, so humidity alone doesn't
 * move the default numbers.
 */
export interface UserConditions {
  temperatureC: number;
  pressureKPa: number;
  relativeHumidity: number;
  fuelRon: number;
}

export const DEFAULT_CONDITIONS: UserConditions = {
  temperatureC: 45,
  pressureKPa: 101.325,
  relativeHumidity: 0.1,
  fuelRon: 95,
};

/** Ambient presets (BUILD_PROMPT 6.2). */
export const AMBIENT_PRESETS_C = [25, 35, 45, 50] as const;

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
  /** Uncertainty as a fraction of torque, per rpm of `run`. */
  band: number[];
}

export function conditionsFrom(input: UserConditions, catalogue: SimCatalogue): Conditions {
  return {
    air: ambientAir({
      temperatureC: input.temperatureC,
      pressureKPa: input.pressureKPa,
      relativeHumidity: input.relativeHumidity,
    }),
    fuel: pumpGasoline(input.fuelRon, catalogue.constants),
  };
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
      fit = fitStockEngine(engine, variant, rating, catalogue.constants);
      this.fits.set(key, fit);
    }
    return fit;
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
  input: UserConditions = DEFAULT_CONDITIONS,
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
  const run = applyLimits(runDyno(fit.model, conditions, k), limitOptions);

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
    band,
  };
}
