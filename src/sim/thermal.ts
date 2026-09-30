import type { ModelConstants, SimEngine } from '../data/sim-data';
import type { OperatingPoint } from './engine/model';

/**
 * The thermal model (BUILD_PROMPT 6.2) and the 3-minute sustained drift
 * session, the heat-soak test.
 *
 * Heat goes into the coolant and the oil as shares of the fuel energy burnt
 * (rotaries put more of it into both), and into the charge air the compressor
 * heats. The radiator gives it to the air in proportion to coolant-over-ambient
 * temperature, less at low airspeed; the oil gives it to the coolant (block
 * and any oil-to-water cooler) and, on engines that have one, to an oil-to-air
 * cooler. The engine's metal, coolant and oil soak it up in between.
 *
 * No maker publishes its radiator's capacity, so the factory system is sized
 * by a rule (model/assumptions.json): it holds its design coolant temperature
 * at full rated power at top-speed airflow on a hot day. The drift session
 * then asks for 70-90 % of full load with the airflow of a car going sideways
 * at low speed, at your ambient. That is where cooling mods earn their place.
 */

/**
 * Where a cooling system's figures come from. `generic-sizing`: the one sizing
 * rule every car gets while no radiator data for it is on file, so its result
 * is an estimate, not a pass or fail for that car. `car-data`: the car's own
 * radiator and oil-cooler figures.
 */
export type CoolingBasis = 'generic-sizing' | 'car-data';

export interface CoolingSystem {
  basis: CoolingBasis;
  /** W/K from coolant to air at the design face velocity. */
  radiator: number;
  /** W/K from oil to coolant (block, oil-to-water cooler). */
  oilToCoolant: number;
  /** W/K from oil to air at the design face velocity (0 without an oil-to-air cooler). */
  oilCooler: number;
  /** J/K that heats with the coolant: engine metal and the coolant itself. */
  coolantCapacity: number;
  /** J/K that heats with the oil. */
  oilCapacity: number;
}

export interface HeatLoad {
  /** W of fuel energy burnt at full load. */
  fuelPower: number;
  /** Shares of fuel energy into the coolant and the oil. */
  toCoolant: number;
  toOil: number;
}

export interface HeatSoakSample {
  /** s */
  time: number;
  /** K */
  coolant: number;
  /** K */
  oil: number;
  /** Share of full load at that moment. */
  load: number;
}

export interface HeatSoakResult {
  /** The cooling system's basis: only `car-data` earns a hard passed or failed. */
  basis: CoolingBasis;
  pass: boolean;
  samples: HeatSoakSample[];
  /** K, the highest of each over the session. */
  peakCoolant: number;
  peakOil: number;
  /** s at which a limit was first crossed, if one was. */
  failedAt?: number;
  failedOn?: 'coolant' | 'oil';
  /** K, the limits the test holds them to. */
  limits: { coolant: number; oil: number };
  /** K, ambient the session ran at. */
  ambient: number;
}

/** Heat shares for an engine at full load. */
export function heatShares(
  engine: SimEngine,
  k: ModelConstants,
): { toCoolant: number; toOil: number } {
  const rotary = engine.layout === 'rotary';
  return {
    toCoolant: rotary ? k['heat-to-coolant-rotary'] : k['heat-to-coolant-piston'],
    toOil: rotary ? k['heat-to-oil-rotary'] : k['heat-to-oil-piston'],
  };
}

/** Fuel power at an operating point, W. */
export function fuelPower(point: OperatingPoint, lhv: number): number {
  return point.fuelFlow * lhv;
}

/**
 * The factory cooling system, sized by the model's rule from the engine's own
 * rated full-load fuel power: the radiator holds the design coolant temperature
 * at the design ambient with that heat load at the design face velocity; oil
 * coolers and thermal masses scale from the engine. Generic sizing: the result
 * is labelled an estimate until the car's own radiator figures are on file.
 */
export function stockCoolingSystem(
  engine: SimEngine,
  ratedFuelPower: number,
  k: ModelConstants,
): CoolingSystem {
  const shares = heatShares(engine, k);
  const designEtd = k['radiator-design-coolant'] - k['radiator-design-ambient'];
  const coolantHeat = shares.toCoolant * ratedFuelPower;
  const oilHeat = shares.toOil * ratedFuelPower;
  const mass = engine.dryWeight?.value ?? k['engine-default-mass'];
  const oilDesignGap = k['oil-design-over-coolant'];
  // An oil-to-air cooler sheds the oil's heat itself; otherwise it goes into
  // the coolant (through the block or an oil-to-water cooler) and the radiator.
  const toAir = engine.cooling?.oilCooler === 'oil-to-air';
  const coolant = engine.cooling?.coolantCapacity ?? k['coolant-default-volume'];
  const oil = engine.oilCapacity ?? k['oil-default-volume'];
  return {
    basis: 'generic-sizing',
    radiator: (coolantHeat + (toAir ? 0 : oilHeat)) / designEtd,
    oilToCoolant: toAir ? 0 : oilHeat / oilDesignGap,
    oilCooler: toAir ? oilHeat / (designEtd + oilDesignGap) : 0,
    coolantCapacity:
      mass * k['engine-thermal-mass-share'] * k['engine-metal-specific-heat'] +
      coolant * k['coolant-density'] * k['coolant-specific-heat'],
    oilCapacity: oil * k['oil-density'] * k['oil-specific-heat'],
  };
}

/** Radiator and oil-cooler conductance at a face velocity, against the design one. */
function airSide(conductance: number, faceVelocity: number, k: ModelConstants): number {
  return (
    conductance *
    Math.pow(faceVelocity / k['radiator-design-face-velocity'], k['radiator-velocity-exponent'])
  );
}

/** How far the thermostat is open, 0-1, at a coolant temperature (K). */
function thermostat(coolant: number, k: ModelConstants): number {
  const open = k['thermostat-open'];
  const span = k['thermostat-span'];
  return Math.min(1, Math.max(0.05, (coolant - open) / span));
}

/** Share of full load `t` seconds into the session: 70 % to 90 %, swinging every cycle. */
export function driftLoad(t: number, k: ModelConstants): number {
  const lo = k['drift-load-low'];
  const hi = k['drift-load-high'];
  const mid = (lo + hi) / 2;
  const swing = (hi - lo) / 2;
  return mid + swing * Math.sin((2 * Math.PI * t) / k['drift-load-period']);
}

/**
 * Runs the 3-minute drift session: coolant and oil temperature every second,
 * from a warm engine (thermostat regulating), at `ambient` K with the airflow
 * of a car drifting at low speed.
 */
export function heatSoak(
  system: CoolingSystem,
  load: HeatLoad,
  ambient: number,
  k: ModelConstants,
): HeatSoakResult {
  const duration = k['drift-duration'];
  const velocity = k['drift-face-velocity'];
  const radiator = airSide(system.radiator, velocity, k);
  const oilCooler = airSide(system.oilCooler, velocity, k);
  const limits = { coolant: k['coolant-limit'], oil: k['oil-limit'] };
  let coolant = k['thermostat-open'] + k['thermostat-span'] / 2;
  let oil = coolant + k['oil-start-over-coolant'];
  const samples: HeatSoakSample[] = [{ time: 0, coolant, oil, load: driftLoad(0, k) }];
  let peakCoolant = coolant;
  let peakOil = oil;
  let failedAt: number | undefined;
  let failedOn: HeatSoakResult['failedOn'];
  const dt = 0.5;
  for (let step = 1; step * dt <= duration + 1e-9; step++) {
    const t = step * dt;
    const share = driftLoad(t - dt / 2, k);
    const qCoolant = share * load.fuelPower * load.toCoolant;
    const qOil = share * load.fuelPower * load.toOil;
    const oilToCoolant = system.oilToCoolant * (oil - coolant);
    const toAir = radiator * thermostat(coolant, k) * Math.max(0, coolant - ambient);
    const oilToAir = oilCooler * Math.max(0, oil - ambient);
    coolant += ((qCoolant + oilToCoolant - toAir) * dt) / system.coolantCapacity;
    oil += ((qOil - oilToCoolant - oilToAir) * dt) / system.oilCapacity;
    peakCoolant = Math.max(peakCoolant, coolant);
    peakOil = Math.max(peakOil, oil);
    if (failedAt === undefined && (coolant > limits.coolant || oil > limits.oil)) {
      failedAt = t;
      failedOn = coolant > limits.coolant ? 'coolant' : 'oil';
    }
    if (Math.abs(t - Math.round(t / 5) * 5) < 1e-9)
      samples.push({ time: t, coolant, oil, load: share });
  }
  return {
    basis: system.basis,
    pass: failedAt === undefined,
    samples,
    peakCoolant,
    peakOil,
    ...(failedAt !== undefined && failedOn ? { failedAt, failedOn } : {}),
    limits,
    ambient,
  };
}
