import type { ModelConstants } from '../data/sim-data';

/**
 * A fuel as the engine model sees it. Part 2a has pump gasoline only, by RON;
 * the full fuel model (race fuel, E85, availability) is part 2b.
 */
export interface Fuel {
  id: string;
  label: string;
  /** Research octane number. */
  ron: number;
  /** Lower heating value, J/kg. */
  lhv: number;
  /** Stoichiometric air-fuel ratio by mass. */
  stoichAfr: number;
  /** kg/m³ */
  density: number;
}

/** Ethanol-free pump gasoline of a given RON. */
export function pumpGasoline(ron: number, k: ModelConstants): Fuel {
  return {
    id: `gasoline-${String(ron)}`,
    label: `${String(ron)} RON gasoline`,
    ron,
    lhv: k['gasoline-lhv'],
    stoichAfr: k['gasoline-stoich-afr'],
    density: k['gasoline-density'],
  };
}
