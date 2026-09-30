import type { ModelConstants } from '../../data/sim-data';
import type { Atmosphere } from '../atmosphere';
import { bisect } from '../math';
import {
  compressorEfficiency,
  compressorOutletTemperature,
  correctedFlow,
  mapPoint,
  type CompressorMap,
  type MapPoint,
} from './compressor';
import {
  intercoolerOutletTemperature,
  intercoolerPressureDrop,
  restrictionDrop,
  type IntercoolerModel,
  type Restriction,
} from './intercooler';
import { turbineFlow, turbineInletPressure, turbinePower, type TurbineModel } from './turbine';

export interface TurboUnit {
  compressor: CompressorMap;
  turbine: TurbineModel;
}

/**
 * One turbo, two in parallel (RB26DETT, early 1JZ-GTE), or two in sequence
 * (2JZ-GTE, 13B-REW, 20B-REW): the primary alone below `changeoverRpm`,
 * both in parallel above it.
 */
export interface TurboSystem {
  layout: 'single' | 'parallel' | 'sequential';
  units: TurboUnit[];
  changeoverRpm?: number;
}

/** Everything between the air filter and the tailpipe that the boost solver needs. */
export interface BoostPlant {
  system: TurboSystem;
  intercooler: IntercoolerModel;
  airFilter: Restriction;
  /** After the turbine: downpipe, catalyst, silencers. On exhaust mass flow. */
  exhaust: Restriction;
}

/** The units running at an rpm, merged into one equivalent turbo (exact for identical units). */
export function activeTurbo(system: TurboSystem, rpm: number): TurboUnit {
  const units =
    system.layout === 'sequential' &&
    system.changeoverRpm !== undefined &&
    rpm < system.changeoverRpm
      ? system.units.slice(0, 1)
      : system.units;
  let choke = 0;
  let capacity = 0;
  let etaC = 0;
  let etaT = 0;
  let maxPr = Infinity;
  for (const u of units) {
    choke += u.compressor.chokeFlow;
    capacity += u.turbine.flowCapacity;
    etaC += u.compressor.peakEfficiency * u.compressor.chokeFlow;
    etaT += u.turbine.efficiency * u.turbine.flowCapacity;
    maxPr = Math.min(maxPr, u.compressor.maxPressureRatio);
  }
  return {
    compressor: { chokeFlow: choke, maxPressureRatio: maxPr, peakEfficiency: etaC / choke },
    turbine: { flowCapacity: capacity, efficiency: etaT / capacity },
  };
}

/** What the engine asks of the turbo at one rpm. */
export interface BoostDemand {
  rpm: number;
  air: Atmosphere;
  /** Pa absolute the wastegate and ECU aim for (never below the ambient pressure). */
  targetPressure: number;
  /** Engine dry-air mass flow, kg/s, at a manifold state. */
  airflow(manifoldPressure: number, chargeTemperature: number, backPressureRatio: number): number;
  /** Turbine inlet temperature, K, at a charge state. */
  turbineInletTemperature(chargeTemperature: number, manifoldPressure: number): number;
  /** Exhaust mass per kg of dry air (1 + fuel-air ratio). */
  exhaustPerAir: number;
}

/** What held the boost where it ended up ('octane': the fuel couldn't take more, engine/model.ts). */
export type BoostLimit = 'target' | 'spool' | 'surge' | 'choke' | 'overspeed' | 'octane';

export interface BoostState {
  /** Pa absolute */
  manifoldPressure: number;
  /** K, after the intercooler */
  chargeTemperature: number;
  /** K */
  compressorOutletTemperature: number;
  pressureRatio: number;
  /** kg/s corrected to the map's reference inlet */
  correctedFlow: number;
  map: MapPoint;
  compressorEfficiency: number;
  /** W */
  compressorPower: number;
  /** Pa absolute, exhaust manifold */
  turbineInletPressure: number;
  /** Pa absolute */
  turbineOutletPressure: number;
  /** K */
  turbineInletTemperature: number;
  /** kg/s dry air */
  airflow: number;
  /** Share of the exhaust the wastegate bypasses, 0-1. */
  wastegateShare: number;
  /** W the turbine could give beyond what the compressor needs, wastegate shut. */
  turbineSurplus: number;
  limit: BoostLimit;
}

/** Steady state at a fixed manifold pressure: iterates charge temperature and back pressure. */
export function boostStateAt(
  plant: BoostPlant,
  demand: BoostDemand,
  manifoldPressure: number,
  k: ModelConstants,
): BoostState {
  const cp = k['air-cp'];
  const gamma = k['air-gamma'];
  const cpE = k['exhaust-cp'];
  const gammaE = k['exhaust-gamma'];
  const etaM = k['turbo-mechanical-efficiency'];
  const turbo = activeTurbo(plant.system, demand.rpm);
  const tAmb = demand.air.temperature;
  let chargeTemperature = tAmb + 30;
  let ratio = 1.3;
  let state: BoostState | undefined;
  for (let i = 0; i < 30; i++) {
    const airflow = demand.airflow(manifoldPressure, chargeTemperature, ratio);
    const p1 = demand.air.pressure - restrictionDrop(plant.airFilter, airflow);
    const outlet = manifoldPressure + intercoolerPressureDrop(plant.intercooler, airflow);
    const pressureRatio = Math.max(1, outlet / p1);
    const corrected = correctedFlow(airflow, tAmb, p1);
    const map = mapPoint(turbo.compressor, corrected, pressureRatio);
    const eta = compressorEfficiency(turbo.compressor, map);
    const t2 = compressorOutletTemperature(tAmb, pressureRatio, eta, gamma);
    const nextCharge = intercoolerOutletTemperature(plant.intercooler, airflow, t2, tAmb);
    const compressorPower = airflow * cp * (t2 - tAmb);
    const t3 = demand.turbineInletTemperature(nextCharge, manifoldPressure);
    const exhaustFlow = airflow * demand.exhaustPerAir;
    const p4 = demand.air.pressure + restrictionDrop(plant.exhaust, exhaustFlow);
    const p3Shut = turbineInletPressure(turbo.turbine, exhaustFlow, t3, p4);
    const shutPower = etaM * turbinePower(turbo.turbine, exhaustFlow, t3, p3Shut, p4, cpE, gammaE);
    let p3 = p3Shut;
    let wastegateShare = 0;
    if (shutPower > compressorPower) {
      // Wastegate open: the turbine takes only the flow the compressor needs.
      const gap = (p: number) =>
        etaM *
          turbinePower(
            turbo.turbine,
            turbineFlow(turbo.turbine, p, t3, p4),
            t3,
            p,
            p4,
            cpE,
            gammaE,
          ) -
        compressorPower;
      p3 = bisect(gap, p4 * (1 + 1e-9), p3Shut, 1) ?? p3Shut;
      wastegateShare = Math.max(0, 1 - turbineFlow(turbo.turbine, p3, t3, p4) / exhaustFlow);
    }
    const nextRatio = p3 / manifoldPressure;
    const settled =
      Math.abs(nextCharge - chargeTemperature) < 0.01 && Math.abs(nextRatio - ratio) < 1e-5;
    chargeTemperature = nextCharge;
    ratio = nextRatio;
    state = {
      manifoldPressure,
      chargeTemperature,
      compressorOutletTemperature: t2,
      pressureRatio,
      correctedFlow: corrected,
      map,
      compressorEfficiency: eta,
      compressorPower,
      turbineInletPressure: p3,
      turbineOutletPressure: p4,
      turbineInletTemperature: t3,
      airflow,
      wastegateShare,
      turbineSurplus: shutPower - compressorPower,
      limit: 'target',
    };
    if (settled) break;
  }
  if (!state) throw new Error('boost solver did not run');
  return state;
}

/**
 * The boost the turbo actually holds at one rpm: the target if the turbine has
 * the energy for it, otherwise the spool-limited balance; then pulled back to
 * the compressor's surge line, choke line or top pressure ratio if the
 * operating point falls off the map.
 */
export function solveBoost(plant: BoostPlant, demand: BoostDemand, k: ModelConstants): BoostState {
  const target = Math.max(demand.targetPressure, demand.air.pressure);
  const floor = demand.air.pressure * 0.85;
  const at = (p: number) => boostStateAt(plant, demand, p, k);
  let state = at(target);
  let limit: BoostLimit = 'target';
  if (state.turbineSurplus < 0) {
    const p = bisect((x) => at(x).turbineSurplus, floor, target, 5) ?? floor;
    state = at(p);
    limit = 'spool';
  }
  const pullBack = (f: (s: BoostState) => number, reason: BoostLimit) => {
    const p = bisect((x) => f(at(x)), floor, state.manifoldPressure, 5);
    if (p !== undefined) {
      state = at(p);
      limit = reason;
    }
  };
  const maxPr = activeTurbo(plant.system, demand.rpm).compressor.maxPressureRatio;
  if (state.map.x > 1) pullBack((s) => s.map.x - 1, 'choke');
  if (state.map.x < 0) pullBack((s) => s.map.x, 'surge');
  if (state.pressureRatio > maxPr) pullBack((s) => s.pressureRatio - maxPr, 'overspeed');
  return { ...state, limit };
}
