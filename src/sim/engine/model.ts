import type { ModelConstants, SimEngine } from '../../data/sim-data';
import { dryPressure, type Atmosphere } from '../atmosphere';
import { extraChargeCooling, type Fuel } from '../fuel';
import { solveBoost, type BoostPlant, type BoostState } from '../induction/turbo';
import {
  solveSupercharger,
  type SuperchargerPlant,
  type SuperchargerState,
} from '../induction/supercharger';
import { bisect, interpolate, omega } from '../math';
import {
  baseIndicatedEfficiency,
  exhaustTemperature,
  knockRetard,
  lambdaWorkFactor,
  retardEfficiency,
  type Ignition,
  type KnockReference,
} from './combustion';
import { frictionMep, mepTorque } from './friction';

/**
 * An engine as the simulation runs it: geometry from the data, plus the
 * breathing the stock calibration inferred (src/sim/calibrate/). Tables are on
 * `grid` (rpm, every 100) and interpolated in between.
 */
export interface EngineModel {
  engine: SimEngine;
  variantId: string;
  /** m³ drawn in per output-shaft revolution at 100 % VE (src/data/displacement.ts). */
  volumePerRev: number;
  compressionRatio: number;
  rotary: boolean;
  /** Full-load lambda target. */
  lambda: number;
  grid: number[];
  /** Volumetric efficiency at the reference state (the rating conditions). */
  ve: number[];
  reference: {
    /** K: intake air (NA) or charge air (boosted) when `ve` holds. */
    intakeTemperature: number[];
    /** p3/p2 when `ve` holds (1 for NA). */
    backPressureRatio: number[];
    knock: {
      retard: number[];
      chargeTemperature: number[];
      manifoldPressure: number[];
      ron: number;
    };
  };
  induction:
    | { kind: 'natural' }
    | {
        kind: 'turbo';
        plant: BoostPlant;
        /**
         * Pa absolute per grid rpm: the manifold pressure the boost control holds.
         * An absolute target is what an ECU with a MAP sensor holds, so at altitude
         * it opens the wastegate less and runs more gauge boost, until the turbo
         * runs out of headroom (spool, surge, choke or its speed limit).
         */
        targetPressure: number[];
      }
    | { kind: 'supercharger'; plant: SuperchargerPlant };
  /** Injectors fitted: count, and flow per injector in m³/s (primary + secondary). */
  injectors?: { count: number; flow: number; secondaryFlow?: number };
  /** Stock ECU map, or a tune that runs each fuel at its knock limit (combustion.ts). */
  ignition: Ignition;
  /**
   * Whether the boost control backs off when the fuel can't take the boost:
   * knock would need more than `knock-max-retard` degrees (a knock-sensing ECU
   * or a tuner does, rather than run the engine into knock). Off for a known
   * build, whose boost is measured on the dyno day.
   */
  octaneLimitsBoost: boolean;
}

export interface Conditions {
  air: Atmosphere;
  fuel: Fuel;
}

/** Everything the model knows at one rpm, full load. SI units. */
export interface OperatingPoint {
  rpm: number;
  /** N·m, crank, net */
  torque: number;
  /** W, crank, net */
  power: number;
  indicatedTorque: number;
  frictionTorque: number;
  pumpingTorque: number;
  /** N·m to drive a supercharger. */
  driveTorque: number;
  /** kg/s */
  airflow: number;
  /** kg/s */
  fuelFlow: number;
  lambda: number;
  afr: number;
  /** Pa absolute */
  manifoldPressure: number;
  /** Pa gauge */
  boost: number;
  /** K, what reaches the cylinders (ambient for NA) */
  chargeTemperature: number;
  /** K, exhaust gas temperature estimate */
  exhaustTemperature: number;
  sparkRetard: number;
  /** K the fuel's evaporation cools the charge beyond gasoline's (E85). */
  evaporativeCooling: number;
  volumetricEfficiency: number;
  /** Brake thermal efficiency on the fuel supplied. */
  brakeEfficiency: number;
  /** Share of injector capacity used, 0-1+ (undefined if the injector flow isn't on file). */
  injectorDuty?: number;
  turbo?: BoostState;
  supercharger?: SuperchargerState;
}

export interface PointOptions {
  /**
   * The calibration's own reference run: the breathing tables are being built
   * at these conditions, so the temperature and back-pressure corrections are 1.
   */
  referenceRun?: boolean;
}

function knockAt(model: EngineModel, rpm: number): KnockReference {
  const { grid } = model;
  const kn = model.reference.knock;
  return {
    retard: interpolate(grid, kn.retard, rpm),
    chargeTemperature: interpolate(grid, kn.chargeTemperature, rpm),
    manifoldPressure: interpolate(grid, kn.manifoldPressure, rpm),
    ron: kn.ron,
  };
}

/** Solves the engine at one rpm and full load. */
export function solvePoint(
  model: EngineModel,
  rpm: number,
  conditions: Conditions,
  k: ModelConstants,
  options: PointOptions = {},
): OperatingPoint {
  const { air, fuel } = conditions;
  const veRef = interpolate(model.grid, model.ve, rpm);
  const tRef = interpolate(model.grid, model.reference.intakeTemperature, rpm);
  const bpRef = interpolate(model.grid, model.reference.backPressureRatio, rpm);
  const knockRef = knockAt(model, rpm);
  const dryShare = dryPressure(air) / air.pressure;
  const rGas = k['air-gas-constant'];
  const perSecond = (model.volumePerRev * rpm) / 60;

  // Ideal-cycle residual-gas relation (Livengood et al., via Yin): VE falls by
  // 1 / (gamma (CR - 1)) per unit rise in exhaust-to-intake pressure ratio.
  const backPressureSlope = 1 / (k['air-gamma'] * (model.compressionRatio - 1));
  const veAt = (chargeTemperature: number, backPressureRatio: number) => {
    if (options.referenceRun) return veRef;
    const temperature = Math.pow(chargeTemperature / tRef, k['ve-temperature-exponent']);
    const backPressure = 1 - backPressureSlope * (backPressureRatio - bpRef);
    return veRef * temperature * backPressure;
  };
  const lambda = model.lambda;
  // A fuel that evaporates with more heat than gasoline (E85) cools the charge
  // in the port: denser air and less knock. Gasoline's own cooling is in the fit.
  const cooling = options.referenceRun ? 0 : extraChargeCooling(fuel, lambda, k);
  const airflowAt = (manifoldPressure: number, chargeTemperature: number, ratio: number) => {
    const t = chargeTemperature - cooling;
    return ((veAt(t, ratio) * manifoldPressure * dryShare) / (rGas * t)) * perSecond;
  };
  const retardAt = (chargeTemperature: number, manifoldPressure: number) =>
    options.referenceRun
      ? knockRef.retard
      : knockRetard(
          knockRef,
          { chargeTemperature: chargeTemperature - cooling, manifoldPressure, ron: fuel.ron },
          k,
          model.ignition,
        );
  const egtAt = (chargeTemperature: number, manifoldPressure: number) =>
    exhaustTemperature(
      {
        chargeTemperature: chargeTemperature - cooling,
        lambda,
        retardDeg: retardAt(chargeTemperature, manifoldPressure),
        rotary: model.rotary,
        fuel,
      },
      k,
    );

  let manifoldPressure = air.pressure;
  let chargeTemperature = air.temperature;
  let backPressureRatio = 1;
  let turbo: BoostState | undefined;
  let supercharger: SuperchargerState | undefined;
  let driveTorque = 0;
  let pumpingTorque = 0;

  if (model.induction.kind === 'turbo') {
    const plant = model.induction.plant;
    const boostAt = (targetPressure: number) =>
      solveBoost(
        plant,
        {
          rpm,
          air,
          targetPressure,
          airflow: airflowAt,
          turbineInletTemperature: egtAt,
          exhaustPerAir: 1 + 1 / (lambda * fuel.stoichAfr),
        },
        k,
      );
    turbo = boostAt(interpolate(model.grid, model.induction.targetPressure, rpm));
    // Octane limits boost (BUILD_PROMPT 6.4): past the knock limit the boost comes down.
    const maxRetard = k['knock-max-retard'];
    const over = (s: BoostState) => retardAt(s.chargeTemperature, s.manifoldPressure) - maxRetard;
    if (model.octaneLimitsBoost && !options.referenceRun && over(turbo) > 1e-6) {
      const p = bisect((x) => over(boostAt(x)), air.pressure, turbo.manifoldPressure, 50);
      turbo = { ...boostAt(p ?? air.pressure), limit: 'octane' };
    }
    manifoldPressure = turbo.manifoldPressure;
    chargeTemperature = turbo.chargeTemperature;
    backPressureRatio = turbo.turbineInletPressure / turbo.manifoldPressure;
    pumpingTorque = mepTorque(
      turbo.turbineInletPressure - turbo.manifoldPressure,
      model.volumePerRev,
    );
  } else if (model.induction.kind === 'supercharger') {
    supercharger = solveSupercharger(
      model.induction.plant,
      rpm,
      air,
      (p, t) => airflowAt(p, t, 1),
      k,
    );
    manifoldPressure = supercharger.manifoldPressure;
    chargeTemperature = supercharger.chargeTemperature;
    driveTorque = supercharger.drivePower / omega(rpm);
  }

  const ve = veAt(chargeTemperature - cooling, backPressureRatio);
  const airflow =
    turbo?.airflow ??
    supercharger?.airflow ??
    airflowAt(manifoldPressure, chargeTemperature, backPressureRatio);
  const sparkRetard = retardAt(chargeTemperature, manifoldPressure);
  const efficiency =
    baseIndicatedEfficiency(model.compressionRatio, model.rotary, k) *
    lambdaWorkFactor(lambda, k) *
    retardEfficiency(sparkRetard, k);
  const w = omega(rpm);
  const indicatedTorque = (airflow * (fuel.lhv / fuel.stoichAfr) * efficiency) / w;
  const frictionTorque = mepTorque(frictionMep(model.engine, rpm, k), model.volumePerRev);
  const torque = indicatedTorque - frictionTorque - pumpingTorque - driveTorque;
  const afr = lambda * fuel.stoichAfr;
  const fuelFlow = airflow / afr;
  const exhaust = turbo?.turbineInletTemperature ?? egtAt(chargeTemperature, manifoldPressure);

  let injectorDuty: number | undefined;
  if (model.injectors) {
    const capacity =
      model.injectors.count * (model.injectors.flow + (model.injectors.secondaryFlow ?? 0));
    injectorDuty = fuelFlow / fuel.density / capacity;
  }

  return {
    rpm,
    torque,
    power: torque * w,
    indicatedTorque,
    frictionTorque,
    pumpingTorque,
    driveTorque,
    airflow,
    fuelFlow,
    lambda,
    afr,
    manifoldPressure,
    boost: manifoldPressure - air.pressure,
    chargeTemperature,
    exhaustTemperature: exhaust,
    sparkRetard,
    evaporativeCooling: cooling,
    volumetricEfficiency: ve,
    brakeEfficiency: (torque * w) / (fuelFlow * fuel.lhv),
    ...(injectorDuty !== undefined ? { injectorDuty } : {}),
    ...(turbo ? { turbo } : {}),
    ...(supercharger ? { supercharger } : {}),
  };
}
