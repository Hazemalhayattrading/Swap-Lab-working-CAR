import { clamp } from '../math';

/**
 * Charge-air cooler: effectiveness (share of the compressor's temperature rise
 * it removes, against ambient) and pressure drop, both referenced to the flow
 * it was sized for. Effectiveness falls as flow rises past the design flow;
 * pressure drop rises with the square of flow (turbulent).
 */
export interface IntercoolerModel {
  effectiveness: number;
  /** kg/s */
  designFlow: number;
  /** Pa at the design flow. */
  pressureDrop: number;
}

export function intercoolerEffectiveness(ic: IntercoolerModel, massFlow: number): number {
  if (ic.effectiveness <= 0) return 0;
  const ratio = massFlow / ic.designFlow;
  return clamp(ic.effectiveness * (1 + 0.3 * (1 - ratio)), 0.2, 0.95);
}

/** Charge temperature after the cooler, K (BUILD_PROMPT 6.1: ambient + heating x (1 - eff)). */
export function intercoolerOutletTemperature(
  ic: IntercoolerModel,
  massFlow: number,
  compressorOutletTemperature: number,
  ambientTemperature: number,
): number {
  const e = intercoolerEffectiveness(ic, massFlow);
  return ambientTemperature + (compressorOutletTemperature - ambientTemperature) * (1 - e);
}

/** Pressure drop across the cooler, Pa. */
export function intercoolerPressureDrop(ic: IntercoolerModel, massFlow: number): number {
  if (ic.effectiveness <= 0) return 0;
  const ratio = massFlow / ic.designFlow;
  return ic.pressureDrop * ratio * ratio;
}

/** A restriction (air filter, exhaust) with a pressure drop quoted at a design flow. */
export interface Restriction {
  /** kg/s */
  designFlow: number;
  /** Pa at the design flow. */
  pressureDrop: number;
}

export function restrictionDrop(r: Restriction, massFlow: number): number {
  const ratio = massFlow / r.designFlow;
  return r.pressureDrop * ratio * ratio;
}
