import { intakeVolumePerRevCc } from '../../data/displacement';
import type { ModelConstants, SimEngine, SimVariant } from '../../data/sim-data';
import { dryAirDensity, dryPressure, type Atmosphere } from '../atmosphere';
import {
  baseIndicatedEfficiency,
  exhaustTemperature,
  lambdaWorkFactor,
  retardEfficiency,
} from '../engine/combustion';
import { frictionMep, mepTorque } from '../engine/friction';
import { solvePoint, type Conditions, type EngineModel } from '../engine/model';
import type { Fuel } from '../fuel';
import { correctedFlow, sizeCompressor } from '../induction/compressor';
import {
  intercoolerPressureDrop,
  restrictionDrop,
  type IntercoolerModel,
} from '../induction/intercooler';
import {
  boostStateAt,
  type BoostDemand,
  type BoostPlant,
  type TurboSystem,
} from '../induction/turbo';
import { bisect, omega } from '../math';
import { referenceCurve, type ReferenceCurve } from './reference-curve';

/**
 * Builds the stock engine model for one engine variant by calibrating it to
 * the maker's figures at the conditions they were rated under.
 *
 * - Naturally aspirated: the volumetric-efficiency curve is solved from the
 *   reference torque curve (src/sim/calibrate/reference-curve.ts), given the
 *   model's combustion efficiency and friction.
 * - Turbocharged: the VE curve takes a generic turbo-engine shape; its level is
 *   set so the model's peak boost matches the published stock boost (or kept
 *   at its prior if no boost is published, and the boost is then inferred).
 *   The boost target curve follows from the reference torque; the compressor
 *   map is sized around the resulting operating line and the turbine so it
 *   just reaches the target at the spool point. Below that, the turbo model
 *   decides the torque.
 *
 * The calibration test (tests/calibration/stock.test.ts) then runs the forward
 * model and checks it against the factory figures.
 */

export interface StockFit {
  model: EngineModel;
  curve: ReferenceCurve;
  conditions: Conditions;
  /** Where the stock boost came from. */
  boost?: {
    source: 'published' | 'inferred';
    /** Pa gauge, the model's stock peak boost. */
    peak: number;
    veLevel: number;
    compressorCompromise: boolean;
    spoolRpm: number;
    changeoverRpm?: number;
  };
  /** Anything the fit had to bend to work. */
  notes: string[];
}

function boosted(variant: SimVariant): boolean {
  return variant.induction !== 'naturally-aspirated';
}

function wotLambda(engine: SimEngine, variant: SimVariant, k: ModelConstants): number {
  if (!boosted(variant)) return k['wot-lambda-na'];
  return engine.layout === 'rotary' ? k['wot-lambda-rotary-turbo'] : k['wot-lambda-turbo'];
}

/** Generic VE shape for a turbo engine: 1 at `peakRpm`, falling away either side. */
function vePriorShape(rpm: number, peakRpm: number, k: ModelConstants): number {
  const u = rpm / peakRpm - 1;
  const droop = u < 0 ? k['ve-prior-low-droop'] : k['ve-prior-high-droop'];
  return Math.max(0.3, 1 - droop * u * u);
}

function injectorsOf(engine: SimEngine, variant: SimVariant): EngineModel['injectors'] {
  if (!variant.injectorFlow) return undefined;
  const count = engine.layout === 'rotary' ? engine.rotors : engine.cylinders;
  return {
    count,
    flow: variant.injectorFlow.value,
    ...(variant.secondaryInjectorFlow
      ? { secondaryFlow: variant.secondaryInjectorFlow.value }
      : {}),
  };
}

function intercoolerFor(
  variant: SimVariant,
  designFlow: number,
  k: ModelConstants,
): IntercoolerModel {
  const effectiveness =
    variant.intercooler === 'air-to-air-front'
      ? k['intercooler-effectiveness-front']
      : variant.intercooler === 'air-to-air-side'
        ? k['intercooler-effectiveness-side']
        : variant.intercooler === 'air-to-water'
          ? k['intercooler-effectiveness-water']
          : 0;
  return {
    effectiveness,
    designFlow,
    pressureDrop: effectiveness > 0 ? k['intercooler-pressure-drop'] : 0,
  };
}

/**
 * rpm the second turbo of a sequential pair joins: the published full-load
 * figure where the data has one, otherwise the model prior.
 */
export function changeoverRpm(variant: SimVariant, k: ModelConstants): number {
  if (variant.turboChangeover) return variant.turboChangeover.value;
  return (
    Math.round((k['sequential-changeover-fraction'] * variant.rating.powerRpm.value) / 100) * 100
  );
}

function blankModel(
  engine: SimEngine,
  variant: SimVariant,
  curve: ReferenceCurve,
  conditions: Conditions,
  k: ModelConstants,
): EngineModel {
  const retard = boosted(variant) ? k['knock-stock-retard-boosted'] : k['knock-stock-retard-na'];
  const injectors = injectorsOf(engine, variant);
  return {
    engine,
    variantId: variant.id,
    volumePerRev: intakeVolumePerRevCc(engine) * 1e-6,
    compressionRatio: variant.compressionRatio.value,
    rotary: engine.layout === 'rotary',
    lambda: wotLambda(engine, variant, k),
    grid: curve.grid,
    ve: curve.grid.map(() => 0.9),
    reference: {
      intakeTemperature: curve.grid.map(() => conditions.air.temperature),
      backPressureRatio: curve.grid.map(() => 1),
      knock: {
        retard: curve.grid.map(() => retard),
        chargeTemperature: curve.grid.map(() => conditions.air.temperature),
        manifoldPressure: curve.grid.map(() => conditions.air.pressure),
        ron: conditions.fuel.ron,
      },
    },
    induction: { kind: 'natural' },
    ...(injectors ? { injectors } : {}),
  };
}

/** Indicated efficiency the stock calibration runs at (its own spark retard). */
function stockEfficiency(model: EngineModel, k: ModelConstants): number {
  return (
    baseIndicatedEfficiency(model.compressionRatio, model.rotary, k) *
    lambdaWorkFactor(model.lambda, k) *
    retardEfficiency(model.reference.knock.retard[0] ?? 0, k)
  );
}

function fitNatural(model: EngineModel, curve: ReferenceCurve, c: Conditions, k: ModelConstants) {
  const rho = dryAirDensity(c.air, k);
  const eta = stockEfficiency(model, k);
  const perKgAir = (c.fuel.lhv / c.fuel.stoichAfr) * eta;
  model.ve = curve.grid.map((n, i) => {
    const t = curve.torque[i] ?? Number.NaN;
    const friction = mepTorque(frictionMep(model.engine, n, k), model.volumePerRev);
    const airflow = ((t + friction) * omega(n)) / perKgAir;
    return airflow / (rho * model.volumePerRev * (n / 60));
  });
}

function turboLayout(variant: SimVariant): TurboSystem['layout'] {
  if (variant.induction === 'twin-turbo-parallel') return 'parallel';
  if (variant.induction === 'twin-turbo-sequential') return 'sequential';
  return 'single';
}

function fitTurbo(
  model: EngineModel,
  variant: SimVariant,
  curve: ReferenceCurve,
  c: Conditions,
  k: ModelConstants,
  notes: string[],
): NonNullable<StockFit['boost']> {
  const { air, fuel } = c;
  const grid = curve.grid;
  const first = grid.findIndex((n) => n >= curve.start);
  const idx = grid.map((_, i) => i).filter((i) => i >= first);
  const peakRpm = (variant.rating.torqueRpm.value + variant.rating.powerRpm.value) / 2;
  const shape = grid.map((n) => vePriorShape(n, peakRpm, k));
  const layout = turboLayout(variant);
  const change = layout === 'sequential' ? changeoverRpm(variant, k) : undefined;
  const published = variant.boost?.value;
  const eta = stockEfficiency(model, k);
  const perKgAir = (fuel.lhv / fuel.stoichAfr) * eta;
  const dryShare = dryPressure(air) / air.pressure;
  const exhaustPerAir = 1 + 1 / (model.lambda * fuel.stoichAfr);
  const rGas = k['air-gas-constant'];
  const retard = model.reference.knock.retard[0] ?? 0;

  let level = k['ve-prior-peak-boosted'];
  const p2 = grid.map(() => air.pressure * 1.6);
  const charge = grid.map(() => air.temperature + 35);
  const ratio = grid.map(() => 1.3);
  const airflow = grid.map(() => 0);
  let capacity = 0.1;
  let plant: BoostPlant | undefined;
  let compromise = false;

  const demandAt = (i: number): BoostDemand => {
    const n = grid[i] ?? 0;
    const perSecond = (model.volumePerRev * n) / 60;
    return {
      rpm: n,
      air,
      targetBoost: (p2[i] ?? air.pressure) - air.pressure,
      airflow: (p, t) => ((level * (shape[i] ?? 1) * p * dryShare) / (rGas * t)) * perSecond,
      turbineInletTemperature: (t) =>
        exhaustTemperature(
          {
            chargeTemperature: t,
            lambda: model.lambda,
            retardDeg: retard,
            rotary: model.rotary,
            fuel,
          },
          k,
        ),
      exhaustPerAir,
    };
  };

  for (let iter = 0; iter < 40; iter++) {
    const before = p2.slice();
    for (const i of idx) {
      const n = grid[i] ?? 0;
      const t = curve.torque[i] ?? 0;
      const friction = mepTorque(frictionMep(model.engine, n, k), model.volumePerRev);
      const pumping = mepTorque(
        ((ratio[i] ?? 1) - 1) * (p2[i] ?? air.pressure),
        model.volumePerRev,
      );
      airflow[i] = ((t + friction + pumping) * omega(n)) / perKgAir;
    }
    const manifoldAt = (i: number, lvl: number) =>
      ((airflow[i] ?? 0) * rGas * (charge[i] ?? air.temperature)) /
      (lvl * (shape[i] ?? 1) * dryShare * model.volumePerRev * ((grid[i] ?? 0) / 60));
    if (published !== undefined) {
      const peak = Math.max(...idx.map((i) => manifoldAt(i, level)));
      level *= peak / (air.pressure + published);
    }
    for (const i of idx) p2[i] = manifoldAt(i, level);

    // Plant sized around the stock operating line.
    const peakFlow = Math.max(...idx.map((i) => airflow[i] ?? 0));
    const intercooler = intercoolerFor(variant, peakFlow, k);
    const airFilter = { designFlow: peakFlow, pressureDrop: k['air-filter-pressure-drop'] };
    const exhaust = {
      designFlow: peakFlow * exhaustPerAir,
      pressureDrop: k['exhaust-back-pressure'],
    };
    const line = idx.map((i) => {
      const flow = airflow[i] ?? 0;
      const p1 = air.pressure - restrictionDrop(airFilter, flow);
      return {
        rpm: grid[i] ?? 0,
        corrected: correctedFlow(flow, air.temperature, p1),
        pressureRatio: ((p2[i] ?? 0) + intercoolerPressureDrop(intercooler, flow)) / p1,
      };
    });
    const sizing = {
      chokePosition: k['compressor-stock-choke-position'],
      pressureRatioFraction: k['compressor-stock-pr-fraction'],
      peakEfficiency: k['compressor-peak-efficiency'],
    };
    const turbine = { flowCapacity: capacity, efficiency: k['turbine-efficiency'] };
    let system: TurboSystem;
    if (layout === 'single') {
      const map = sizeCompressor(line, sizing);
      compromise = map.compromise;
      system = { layout, units: [{ compressor: map, turbine }] };
    } else if (layout === 'parallel') {
      const map = sizeCompressor(line, sizing);
      compromise = map.compromise;
      const unit = { ...map, chokeFlow: map.chokeFlow / 2 };
      system = { layout, units: [0, 1].map(() => ({ compressor: unit, turbine: { ...turbine } })) };
    } else {
      const alone = line.filter((p) => p.rpm < (change ?? 0));
      const both = line.filter((p) => p.rpm >= (change ?? 0));
      const a = alone.length > 0 ? sizeCompressor(alone, sizing) : undefined;
      const b = both.length > 0 ? sizeCompressor(both, sizing) : undefined;
      compromise = (a?.compromise ?? false) || (b?.compromise ?? false);
      const chokeFlow = Math.max(a?.chokeFlow ?? 0, (b?.chokeFlow ?? 0) / 2);
      const maxPressureRatio = Math.max(a?.maxPressureRatio ?? 1.5, b?.maxPressureRatio ?? 1.5);
      const unit = { chokeFlow, maxPressureRatio, peakEfficiency: sizing.peakEfficiency };
      system = {
        layout,
        units: [0, 1].map(() => ({ compressor: unit, turbine: { ...turbine } })),
        ...(change !== undefined ? { changeoverRpm: change } : {}),
      };
    }
    const current: BoostPlant = { system, intercooler, airFilter, exhaust };
    plant = current;

    // Turbine: just enough, wastegate shut, at the spool point. A sequential
    // pair must also hold the target the moment the second turbo opens (twice
    // the turbine flow area), so each unit is the smaller of the two sizes.
    const surplusWith = (i: number) => (perUnit: number) => {
      for (const u of current.system.units) u.turbine.flowCapacity = perUnit;
      return boostStateAt(current, demandAt(i), p2[i] ?? air.pressure, k).turbineSurplus;
    };
    const spool = idx[0] ?? 0;
    const sizingPoints = [spool];
    if (change !== undefined && (grid[spool] ?? 0) < change) {
      const joins = idx.find((i) => (grid[i] ?? 0) >= change);
      if (joins !== undefined) sizingPoints.push(joins);
    }
    const sizes = sizingPoints
      .map((i) => bisect(surplusWith(i), 0.002, 5, 1e-6))
      .filter((x): x is number => x !== undefined);
    if (sizes.length === 0) {
      notes.push('turbine sizing did not bracket; kept the previous capacity');
    } else {
      // A hair smaller than the exact balance, so the sizing point holds its target.
      capacity = Math.min(...sizes) * 0.999;
    }
    for (const u of current.system.units) u.turbine.flowCapacity = capacity;

    for (const i of idx) {
      const s = boostStateAt(current, demandAt(i), p2[i] ?? air.pressure, k);
      charge[i] = s.chargeTemperature;
      ratio[i] = s.turbineInletPressure / s.manifoldPressure;
    }
    const moved = Math.max(...idx.map((i) => Math.abs((p2[i] ?? 0) - (before[i] ?? 0))));
    if (iter > 2 && moved < 1) break;
  }
  if (!plant) throw new Error('turbo fit did not run');

  const spoolIndex = idx[0] ?? 0;
  const spoolBoost = (p2[spoolIndex] ?? air.pressure) - air.pressure;
  model.ve = shape.map((s) => level * s);
  model.induction = {
    kind: 'turbo',
    plant,
    targetBoost: grid.map((_, i) =>
      i < spoolIndex ? spoolBoost : (p2[i] ?? air.pressure) - air.pressure,
    ),
  };
  if (compromise) notes.push('the generic compressor map could not fit the stock line cleanly');
  const peak = Math.max(...idx.map((i) => (p2[i] ?? 0) - air.pressure));
  return {
    source: published !== undefined ? 'published' : 'inferred',
    peak,
    veLevel: level,
    compressorCompromise: compromise,
    spoolRpm: curve.start,
    ...(change !== undefined ? { changeoverRpm: change } : {}),
  };
}

/** Runs the model at its own rating conditions and records the state the tables refer to. */
function recordReference(model: EngineModel, c: Conditions, k: ModelConstants): void {
  const intake: number[] = [];
  const back: number[] = [];
  const temps: number[] = [];
  const pressures: number[] = [];
  for (const n of model.grid) {
    const p = solvePoint(model, n, c, k, { referenceRun: true });
    intake.push(p.chargeTemperature);
    back.push(p.turbo ? p.turbo.turbineInletPressure / p.turbo.manifoldPressure : 1);
    temps.push(p.chargeTemperature);
    pressures.push(p.manifoldPressure);
  }
  model.reference.intakeTemperature = intake;
  model.reference.backPressureRatio = back;
  model.reference.knock.chargeTemperature = temps;
  model.reference.knock.manifoldPressure = pressures;
}

export function fitStockEngine(
  engine: SimEngine,
  variant: SimVariant,
  rating: { air: Atmosphere; fuel: Fuel },
  k: ModelConstants,
): StockFit {
  const notes: string[] = [];
  const isBoosted = boosted(variant);
  const curve = referenceCurve(variant, isBoosted, k);
  const conditions: Conditions = { air: rating.air, fuel: rating.fuel };
  const model = blankModel(engine, variant, curve, conditions, k);
  let boost: StockFit['boost'];
  if (isBoosted) boost = fitTurbo(model, variant, curve, conditions, k, notes);
  else fitNatural(model, curve, conditions, k);
  recordReference(model, conditions, k);
  return { model, curve, conditions, ...(boost ? { boost } : {}), notes };
}
