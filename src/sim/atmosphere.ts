import type { ModelConstants, SimRatingStandard, SimStandardAtmosphere } from '../data/sim-data';

/** Air at the engine's intake, SI. */
export interface Atmosphere {
  /** K */
  temperature: number;
  /** Pa, total barometric pressure. */
  pressure: number;
  /** Pa, partial pressure of water vapour. */
  vapourPressure: number;
}

/** Dry-air partial pressure, Pa: the oxygen-carrying part of the charge. */
export function dryPressure(a: Atmosphere): number {
  return a.pressure - a.vapourPressure;
}

/** Mass of dry air per m³, kg/m³. */
export function dryAirDensity(a: Atmosphere, k: ModelConstants): number {
  return dryPressure(a) / (k['air-gas-constant'] * a.temperature);
}

/**
 * Saturation vapour pressure over water, Pa, from the Buck (1981) equation as
 * revised in 1996: e = 611.21 exp((18.678 - t/234.5) t / (257.14 + t)), t in °C.
 */
export function saturationVapourPressure(temperatureK: number): number {
  const t = temperatureK - 273.15;
  return 611.21 * Math.exp(((18.678 - t / 234.5) * t) / (257.14 + t));
}

/** Ambient air from what a user sets: temperature, barometric pressure, humidity (0-1). */
export function ambientAir(opts: {
  temperatureC: number;
  pressureKPa: number;
  relativeHumidity: number;
}): Atmosphere {
  const temperature = opts.temperatureC + 273.15;
  return {
    temperature,
    pressure: opts.pressureKPa * 1000,
    vapourPressure: opts.relativeHumidity * saturationVapourPressure(temperature),
  };
}

/** The reference atmosphere a rating standard corrects its figures to. */
export function ratingAtmosphere(standard: SimRatingStandard): Atmosphere {
  const pressure =
    standard.pressureBasis === 'dry-air'
      ? standard.pressure + standard.vapourPressure
      : standard.pressure;
  return {
    temperature: standard.temperature,
    pressure,
    vapourPressure: standard.vapourPressure,
  };
}

/**
 * Barometric pressure at an elevation in the International Standard Atmosphere
 * (troposphere): p = p0 (1 - L h / T0)^n, Pa, with the sea-level values, lapse
 * rate L and exponent n = g0 M / (R L) of standards/locations.json.
 */
export function standardPressure(elevation: number, isa: SimStandardAtmosphere): number {
  return (
    isa.seaLevelPressure *
    Math.pow(1 - (isa.lapseRate * elevation) / isa.seaLevelTemperature, isa.exponent)
  );
}
