import type { ModelConstants } from '../../data/sim-data';

/**
 * How much work a kilogram of air gives at a given lambda, relative to a
 * stoichiometric mixture. Rich of stoichiometric all the oxygen is used and
 * the work peaks slightly rich (charge cooling, more moles of product), then
 * falls as the extra fuel only cools the charge. Lean of it, the fuel is the
 * limit, so work falls with 1/lambda.
 */
export function lambdaWorkFactor(lambda: number, k: ModelConstants): number {
  if (lambda >= 1) return 1 / lambda;
  const peak = k['lambda-peak-work'];
  const gain = k['lambda-peak-work-gain'];
  const u = (lambda - peak) / (1 - peak);
  return 1 + gain - gain * u * u;
}

/**
 * Indicated fuel-conversion efficiency at MBT spark timing and stoichiometric
 * mixture: the air-standard Otto trend 1 - CR^(1 - gamma) with an effective
 * gamma, scaled down to real engines (heat loss, finite combustion time,
 * and for a rotary the long, thin chamber and seal leakage).
 */
export function baseIndicatedEfficiency(
  compressionRatio: number,
  rotary: boolean,
  k: ModelConstants,
): number {
  const scale = rotary
    ? k['indicated-efficiency-scale-rotary']
    : k['indicated-efficiency-scale-piston'];
  return scale * (1 - Math.pow(compressionRatio, 1 - k['cycle-gamma']));
}

/**
 * Efficiency lost to spark retard from MBT, in crank (or eccentric-shaft)
 * degrees. Near MBT the loss is quadratic (the flat top of a spark sweep);
 * beyond `knock-loss-linear-from` it continues linearly at the same slope.
 */
export function retardEfficiency(retardDeg: number, k: ModelConstants): number {
  if (retardDeg <= 0) return 1;
  const q = k['knock-loss-quadratic'];
  const t0 = k['knock-loss-linear-from'];
  const loss =
    retardDeg <= t0 ? q * retardDeg * retardDeg : q * t0 * t0 + 2 * q * t0 * (retardDeg - t0);
  return Math.max(0.2, 1 - loss);
}

/** The knock state of the stock calibration at one rpm, at its rating conditions. */
export interface KnockReference {
  /** Degrees of retard from MBT the stock calibration runs at, on its rating fuel. */
  retard: number;
  /** K, charge temperature at the rating conditions. */
  chargeTemperature: number;
  /** Pa absolute, manifold pressure at the rating conditions. */
  manifoldPressure: number;
  /** RON of the fuel the figure was rated on. */
  ron: number;
}

/**
 * Spark retard the knock control ends up at. The stock ECU's map is taken as
 * right at the knock limit on its rating fuel. A hotter charge, more manifold
 * pressure or a lower octane raises the octane the engine needs; each octane
 * number short costs `knock-retard-per-octane` degrees. A better fuel doesn't
 * advance a stock map past its own base timing (no adaptive advance).
 */
export function knockRetard(
  ref: KnockReference,
  state: { chargeTemperature: number; manifoldPressure: number; ron: number },
  k: ModelConstants,
): number {
  const needed =
    k['knock-octane-per-kelvin'] * (state.chargeTemperature - ref.chargeTemperature) +
    (k['knock-octane-per-kpa'] * (state.manifoldPressure - ref.manifoldPressure)) / 1000;
  const shortfall = needed - (state.ron - ref.ron);
  return ref.retard + Math.max(0, k['knock-retard-per-octane'] * shortfall);
}

/**
 * Exhaust gas temperature leaving the engine (turbine inlet for a turbo), K,
 * from a first-law split: a fraction of the energy released per kilogram of
 * air goes to the exhaust, more of it when the spark is retarded. Rich of
 * stoichiometric the air limits the energy released. An estimate, not a
 * measurement: part 2b's thermal model builds on it.
 */
export function exhaustTemperature(
  opts: {
    chargeTemperature: number;
    lambda: number;
    retardDeg: number;
    rotary: boolean;
    fuel: { lhv: number; stoichAfr: number };
  },
  k: ModelConstants,
): number {
  const { chargeTemperature, lambda, retardDeg, rotary, fuel } = opts;
  const releasedPerKgAir = (fuel.lhv / fuel.stoichAfr) * Math.min(1, 1 / lambda);
  const fraction =
    (rotary ? k['egt-fraction-rotary'] : k['egt-fraction-piston']) +
    k['egt-fraction-per-degree'] * Math.max(0, retardDeg);
  const exhaustPerKgAir = 1 + 1 / (lambda * fuel.stoichAfr);
  return chargeTemperature + (releasedPerKgAir * fraction) / (exhaustPerKgAir * k['exhaust-cp']);
}
