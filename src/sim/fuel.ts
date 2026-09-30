import type { ModelConstants, SimFuel } from '../data/sim-data';

/**
 * A fuel as the engine model sees it (BUILD_PROMPT 6.4): its octane, its
 * energy per kilogram, its stoichiometric air-fuel ratio, its density (for
 * injector flow) and its heat of vaporisation (how much it cools the charge
 * as it evaporates). Gasoline grades share the model's gasoline properties;
 * E85 and race fuels carry their own (src/data/standards/fuels.json).
 */
export interface Fuel {
  id: string;
  label: string;
  kind: SimFuel['kind'];
  /** Research octane number. */
  ron: number;
  /** Lower heating value, J/kg. */
  lhv: number;
  /** Stoichiometric air-fuel ratio by mass. */
  stoichAfr: number;
  /** kg/m³ */
  density: number;
  /** Latent heat of vaporisation, J/kg. */
  heatOfVaporisation: number;
  /** A stock ECU can't run it (E85); the model assumes a tune for it. */
  needsTune: boolean;
}

/** Ethanol-free pump gasoline of a given RON (also how factory ratings are modelled). */
export function pumpGasoline(ron: number, k: ModelConstants): Fuel {
  return {
    id: `gasoline-${String(ron)}`,
    label: `${String(ron)} RON gasoline`,
    kind: 'pump-gasoline',
    ron,
    lhv: k['gasoline-lhv'],
    stoichAfr: k['gasoline-stoich-afr'],
    density: k['gasoline-density'],
    heatOfVaporisation: k['gasoline-heat-of-vaporisation'],
    needsTune: false,
  };
}

/** A fuel the user picked, with gasoline's properties wherever the file gives none. */
export function fuelFrom(choice: SimFuel, k: ModelConstants): Fuel {
  const gasoline = pumpGasoline(choice.ron, k);
  return {
    ...gasoline,
    id: choice.id,
    label: choice.name,
    kind: choice.kind,
    lhv: choice.lhv ?? gasoline.lhv,
    stoichAfr: choice.stoichAfr ?? gasoline.stoichAfr,
    density: choice.density ?? gasoline.density,
    heatOfVaporisation: choice.heatOfVaporisation ?? gasoline.heatOfVaporisation,
    needsTune: choice.needsTune,
  };
}

/**
 * Extra cooling of the charge, K, from a fuel that evaporates with more heat
 * per kilogram of air than gasoline at the same lambda (E85 takes about three
 * times as much). Gasoline's own cooling is already in the stock calibration,
 * so only the difference counts, and only the share of the evaporation that
 * draws its heat from the air (`charge-cooling-share`; the rest comes off the
 * port walls and valves).
 */
export function extraChargeCooling(fuel: Fuel, lambda: number, k: ModelConstants): number {
  const perKgAir = (f: { heatOfVaporisation: number; stoichAfr: number }) =>
    f.heatOfVaporisation / (lambda * f.stoichAfr);
  const gasoline = {
    heatOfVaporisation: k['gasoline-heat-of-vaporisation'],
    stoichAfr: k['gasoline-stoich-afr'],
  };
  const extra = perKgAir(fuel) - perKgAir(gasoline);
  return Math.max(0, (k['charge-cooling-share'] * extra) / k['air-cp']);
}
