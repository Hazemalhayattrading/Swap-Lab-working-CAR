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

/**
 * Belt-driven superchargers (BUILD_PROMPT 6.1). No car in the launch roster has
 * one from the factory; these models serve the Phase 3 parts catalogue, which
 * supplies each product's figures.
 *
 * - Positive displacement (roots, twin-screw): pumps a fixed volume per
 *   revolution, less leakage that grows with pressure ratio. Boost is whatever
 *   pressure makes the engine swallow what the blower pumps.
 * - Centrifugal (ProCharger, Vortech, Rotrex): an impeller whose pressure rise
 *   grows with the square of tip speed, so boost climbs with rpm; its map sets
 *   surge, choke and efficiency.
 * Both cost crank power to drive, which the model subtracts.
 */
export interface DisplacementBlower {
  kind: 'roots' | 'twin-screw';
  /** m³ per blower revolution */
  displacementPerRev: number;
  /** Blower rpm per engine rpm (pulley ratio). */
  driveRatio: number;
  /** Blower volumetric efficiency at pressure ratio 1. */
  volumetricEfficiency: number;
  /** Fall in blower volumetric efficiency per unit of (pressure ratio - 1): leakage. */
  leakagePerPressureRatio: number;
  adiabaticEfficiency: number;
  /** Belt and gear efficiency. */
  driveEfficiency: number;
  /** Pa gauge where the bypass or relief valve holds boost, if any. */
  maxBoost?: number;
}

export interface CentrifugalSupercharger {
  kind: 'centrifugal';
  /** m, impeller tip diameter */
  impellerDiameter: number;
  /** Impeller rpm per engine rpm (pulley ratio x internal step-up). */
  driveRatio: number;
  /** Pressure rise per tip speed squared: (PR^((γ-1)/γ) - 1) · cp · T1 = headCoefficient · U². */
  headCoefficient: number;
  map: CompressorMap;
  driveEfficiency: number;
  maxBoost?: number;
}

export type Supercharger = DisplacementBlower | CentrifugalSupercharger;

export interface SuperchargerPlant {
  charger: Supercharger;
  intercooler: IntercoolerModel;
  airFilter: Restriction;
}

export interface SuperchargerState {
  /** Pa absolute */
  manifoldPressure: number;
  /** K */
  chargeTemperature: number;
  pressureRatio: number;
  /** kg/s dry air */
  airflow: number;
  efficiency: number;
  /** W taken from the crank */
  drivePower: number;
  map?: MapPoint;
  limit: 'flow-balance' | 'bypass' | 'surge' | 'choke';
}

type Airflow = (manifoldPressure: number, chargeTemperature: number) => number;

function displacementState(
  plant: SuperchargerPlant & { charger: DisplacementBlower },
  rpm: number,
  air: Atmosphere,
  airflow: Airflow,
  k: ModelConstants,
): SuperchargerState {
  const b = plant.charger;
  const gamma = k['air-gamma'];
  const dryDensity = (p: number, t: number) =>
    (p * (1 - air.vapourPressure / air.pressure)) / (k['air-gas-constant'] * t);
  const stateAt = (p2: number) => {
    let charge = air.temperature + 20;
    let flow = 0;
    let pr = 1;
    let t2 = air.temperature;
    for (let i = 0; i < 20; i++) {
      flow = airflow(p2, charge);
      const p1 = air.pressure - restrictionDrop(plant.airFilter, flow);
      pr = Math.max(1, (p2 + intercoolerPressureDrop(plant.intercooler, flow)) / p1);
      t2 = compressorOutletTemperature(air.temperature, pr, b.adiabaticEfficiency, gamma);
      charge = intercoolerOutletTemperature(plant.intercooler, flow, t2, air.temperature);
    }
    const p1 = air.pressure - restrictionDrop(plant.airFilter, flow);
    const blowerVe = Math.max(0.2, b.volumetricEfficiency - b.leakagePerPressureRatio * (pr - 1));
    const pumped =
      blowerVe *
      b.displacementPerRev *
      ((b.driveRatio * rpm) / 60) *
      dryDensity(p1, air.temperature);
    return { flow, pumped, pr, charge, t2 };
  };
  let limit: SuperchargerState['limit'] = 'flow-balance';
  let p2 =
    bisect(
      (p) => {
        const s = stateAt(p);
        return s.pumped - s.flow;
      },
      air.pressure * 0.8,
      air.pressure * 4,
      5,
    ) ?? air.pressure;
  if (b.maxBoost !== undefined && p2 > air.pressure + b.maxBoost) {
    p2 = air.pressure + b.maxBoost;
    limit = 'bypass';
  }
  const s = stateAt(p2);
  return {
    manifoldPressure: p2,
    chargeTemperature: s.charge,
    pressureRatio: s.pr,
    airflow: s.flow,
    efficiency: b.adiabaticEfficiency,
    // A bypassed blower still compresses what it pumps; drive power follows the pumped mass.
    drivePower:
      (Math.max(s.pumped, s.flow) * k['air-cp'] * (s.t2 - air.temperature)) / b.driveEfficiency,
    limit,
  };
}

function centrifugalState(
  plant: SuperchargerPlant & { charger: CentrifugalSupercharger },
  rpm: number,
  air: Atmosphere,
  airflow: Airflow,
  k: ModelConstants,
): SuperchargerState {
  const c = plant.charger;
  const gamma = k['air-gamma'];
  const tip = (Math.PI * c.impellerDiameter * c.driveRatio * rpm) / 60;
  const head = (c.headCoefficient * tip * tip) / (k['air-cp'] * air.temperature);
  let pr = Math.pow(1 + head, gamma / (gamma - 1));
  let limit: SuperchargerState['limit'] = 'flow-balance';
  let charge = air.temperature + 20;
  let flow = 0;
  let p2 = air.pressure;
  let map: MapPoint | undefined;
  let eta = c.map.peakEfficiency;
  let t2 = air.temperature;
  for (let i = 0; i < 20; i++) {
    const p1 = air.pressure - restrictionDrop(plant.airFilter, flow);
    p2 = pr * p1 - intercoolerPressureDrop(plant.intercooler, flow);
    if (c.maxBoost !== undefined && p2 > air.pressure + c.maxBoost) {
      p2 = air.pressure + c.maxBoost;
      pr = (p2 + intercoolerPressureDrop(plant.intercooler, flow)) / p1;
      limit = 'bypass';
    }
    flow = airflow(p2, charge);
    map = mapPoint(c.map, correctedFlow(flow, air.temperature, p1), pr);
    eta = compressorEfficiency(c.map, map);
    t2 = compressorOutletTemperature(air.temperature, pr, eta, gamma);
    charge = intercoolerOutletTemperature(plant.intercooler, flow, t2, air.temperature);
  }
  if (map && map.x < 0) limit = 'surge';
  if (map && map.x > 1) limit = 'choke';
  return {
    manifoldPressure: p2,
    chargeTemperature: charge,
    pressureRatio: pr,
    airflow: flow,
    efficiency: eta,
    drivePower: (flow * k['air-cp'] * (t2 - air.temperature)) / c.driveEfficiency,
    ...(map ? { map } : {}),
    limit,
  };
}

/** Steady state of a supercharger at one rpm, given the engine's airflow at a manifold state. */
export function solveSupercharger(
  plant: SuperchargerPlant,
  rpm: number,
  air: Atmosphere,
  airflow: Airflow,
  k: ModelConstants,
): SuperchargerState {
  const { charger } = plant;
  return charger.kind === 'centrifugal'
    ? centrifugalState({ ...plant, charger }, rpm, air, airflow, k)
    : displacementState({ ...plant, charger }, rpm, air, airflow, k);
}
