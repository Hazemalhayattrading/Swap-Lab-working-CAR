/**
 * A turbocharger turbine as a nozzle with an effective flow capacity (the
 * "ellipse law" used in mean-value turbo models): mass flow rises with inlet
 * pressure and falls with inlet temperature, and chokes as the expansion
 * ratio grows. Capacity is the flow at 1 atm, 1000 K inlet, fully expanded.
 */
export interface TurbineModel {
  /** kg/s */
  flowCapacity: number;
  efficiency: number;
}

export const TURBINE_REFERENCE_TEMPERATURE = 1000;
export const TURBINE_REFERENCE_PRESSURE = 101_325;

/** Mass flow through the turbine at an inlet state, kg/s. */
export function turbineFlow(t: TurbineModel, p3: number, t3: number, p4: number): number {
  if (p3 <= p4) return 0;
  const r = p4 / p3;
  return (
    t.flowCapacity *
    (p3 / TURBINE_REFERENCE_PRESSURE) *
    Math.sqrt(TURBINE_REFERENCE_TEMPERATURE / t3) *
    Math.sqrt(1 - r * r)
  );
}

/** Inlet pressure that passes a mass flow, Pa (the inverse of turbineFlow). */
export function turbineInletPressure(
  t: TurbineModel,
  massFlow: number,
  t3: number,
  p4: number,
): number {
  const c =
    (massFlow * TURBINE_REFERENCE_PRESSURE * Math.sqrt(t3 / TURBINE_REFERENCE_TEMPERATURE)) /
    t.flowCapacity;
  return Math.sqrt(c * c + p4 * p4);
}

/** Shaft power from expanding `massFlow` from p3 to p4, W. */
export function turbinePower(
  t: TurbineModel,
  massFlow: number,
  t3: number,
  p3: number,
  p4: number,
  cp: number,
  gamma: number,
): number {
  if (p3 <= p4) return 0;
  return massFlow * cp * t3 * t.efficiency * (1 - Math.pow(p4 / p3, (gamma - 1) / gamma));
}
