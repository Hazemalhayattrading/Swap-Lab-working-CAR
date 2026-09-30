import type { SimCorrection, SimDyno } from '../data/sim-data';
import { dryPressure, type Atmosphere } from './atmosphere';

/**
 * Normalising a real dyno sheet (BUILD_PROMPT 6.5): chassis dynos correct the
 * power they measure to a reference atmosphere, each standard its own, and
 * different dynos read the same car differently. The model's wheel power is a
 * Dynojet-type inertia reading; a known build's prediction is turned into
 * what its own dyno would have printed.
 */

/** The factor a dyno multiplies measured power by, for air `air` (1 at the reference). */
export function correctionFactor(correction: SimCorrection, air: Atmosphere): number {
  const r = correction.reference;
  if (!r) return 1;
  const pressure = r.pressureBasis === 'dry-air' ? dryPressure(air) : air.pressure;
  return (
    r.scale *
      Math.pow(r.pressure / pressure, r.pressureExponent) *
      Math.pow(air.temperature / r.temperature, r.temperatureExponent) -
    r.offset
  );
}

/**
 * The air a correction standard corrects to, as an atmosphere: for a sheet
 * that doesn't print its test-day air, the model runs here and the factor is 1.
 * A dry-air reference gets `vapourPressure` of water vapour on top.
 */
export function correctionAtmosphere(
  correction: SimCorrection,
  vapourPressure: number,
): Atmosphere | undefined {
  const r = correction.reference;
  if (!r) return undefined;
  return {
    temperature: r.temperature,
    pressure: r.pressureBasis === 'dry-air' ? r.pressure + vapourPressure : r.pressure,
    vapourPressure,
  };
}

/** What `dyno` prints for a car whose Dynojet-type wheel power at `air` is `wheelPower`. */
export function dynoReading(
  wheelPower: number,
  dyno: SimDyno,
  correction: SimCorrection,
  air: Atmosphere,
): { reading: number; readingFactor: number; correctionFactor: number } {
  const cf = correctionFactor(correction, air);
  const readingFactor = dyno.readingFactor.value;
  return { reading: wheelPower * readingFactor * cf, readingFactor, correctionFactor: cf };
}
