import type { ModelConstants, SimBuildSpec } from '../data/sim-data';
import { dryAirDensity, type Atmosphere } from './atmosphere';
import type { StockFit } from './calibrate/stock-model';
import { exhaustTemperature } from './engine/combustion';
import type { EngineModel } from './engine/model';
import { pumpGasoline } from './fuel';
import type { IntercoolerModel } from './induction/intercooler';
import type { CentrifugalSupercharger } from './induction/supercharger';
import { boostStateAt, type BoostPlant, type TurboSystem } from './induction/turbo';
import { bisect, interpolate } from './math';

/**
 * A modified engine (BUILD_PROMPT 6.1, 6.5): the stock calibration of the
 * engine, with the parts a build changes. Only what the model can represent
 * physically changes; the breathing the stock fit found (VE) stays, since
 * builds with other camshafts or porting are out of scope.
 *
 * - Boost: the documented gauge boost, held from the documented full-boost
 *   rpm, as an absolute target at the day's air.
 * - A new turbo: its maker's compressor map (choke flow, top pressure ratio,
 *   peak efficiency); the turbine is sized so it just holds that boost at the
 *   documented full-boost rpm, the way the stock turbine is sized at the
 *   stock spool point.
 * - Intercooler, intake and exhaust: restriction and effectiveness from the
 *   model's aftermarket constants (model/assumptions.json); a cat-back frees
 *   less than headers or a downpipe with it.
 * - Naturally aspirated intake and exhaust: the density gain of a freer
 *   intake and the residual-gas and pumping gain of less back pressure.
 * - A supercharger kit: a centrifugal compressor whose head is set by the
 *   documented boost at its documented rpm (head rises with tip speed squared).
 * - An ECU tune: ignition at the knock limit on the day's fuel.
 */

function copyPlant(plant: BoostPlant): BoostPlant {
  return {
    system: {
      ...plant.system,
      units: plant.system.units.map((u) => ({
        compressor: { ...u.compressor },
        turbine: { ...u.turbine },
      })),
    },
    intercooler: { ...plant.intercooler },
    airFilter: { ...plant.airFilter },
    exhaust: { ...plant.exhaust },
  };
}

function aftermarketIntercooler(stock: IntercoolerModel, k: ModelConstants): IntercoolerModel {
  return {
    effectiveness: k['intercooler-effectiveness-aftermarket'],
    designFlow: stock.designFlow * k['intercooler-aftermarket-flow-scale'],
    pressureDrop: k['intercooler-pressure-drop-aftermarket'],
  };
}

/** Gauge boost the build holds at `rpm`: the peak, tapering to its value at peak power. */
function boostAt(
  spec: NonNullable<SimBuildSpec['boost']>,
  rpm: number,
  from: number,
  peakPowerRpm: number | undefined,
): number {
  if (spec.atPeakPower === undefined || peakPowerRpm === undefined || peakPowerRpm <= from) {
    return spec.peak;
  }
  return interpolate([from, peakPowerRpm], [spec.peak, spec.atPeakPower], rpm);
}

export interface BuildOptions {
  /** The day's air: boost is documented as gauge pressure against it. */
  air: Atmosphere;
  /** rpm of the build's documented peak power, for a boost that tapers. */
  peakPowerRpm?: number;
}

export function applyBuild(
  fit: StockFit,
  spec: SimBuildSpec,
  options: BuildOptions,
  k: ModelConstants,
): EngineModel {
  const stock = fit.model;
  const model: EngineModel = {
    ...stock,
    ve: stock.ve.slice(),
    ignition: spec.ecu === 'tuned' ? 'knock-limited' : 'stock-map',
    // The boost is what the dyno day measured, not a request the model may refuse.
    octaneLimitsBoost: false,
  };
  if (spec.injectorFlow === 'unstated') {
    // Bigger injectors of a size the source doesn't give: fuel doesn't limit.
    delete model.injectors;
  } else if (stock.injectors && (spec.injectorFlow !== undefined || spec.secondaryInjectorFlow)) {
    const secondary = spec.secondaryInjectorFlow ?? stock.injectors.secondaryFlow;
    model.injectors = {
      count: stock.injectors.count,
      flow: spec.injectorFlow ?? stock.injectors.flow,
      ...(secondary !== undefined ? { secondaryFlow: secondary } : {}),
    };
  }

  // A tuned rotary runs leaner than its factory map (model/assumptions.json).
  if (spec.ecu === 'tuned' && stock.rotary && stock.induction.kind === 'turbo') {
    model.lambda = k['wot-lambda-rotary-tuned'];
  }

  if (stock.induction.kind === 'turbo') {
    const plant = copyPlant(stock.induction.plant);
    if (spec.intercooler === 'aftermarket') {
      plant.intercooler = aftermarketIntercooler(plant.intercooler, k);
    }
    if (spec.exhaust !== 'stock') {
      // A cat-back keeps the factory downpipe and catalyst, the main
      // restrictions, so it keeps the same share of the factory figure as the
      // generic constants give (a variant can carry its own factory figure).
      const factory = plant.exhaust.pressureDrop;
      plant.exhaust.pressureDrop =
        spec.exhaust === 'full'
          ? Math.min(factory, k['exhaust-back-pressure-turbo-back'])
          : (factory * k['exhaust-back-pressure-cat-back']) / k['exhaust-back-pressure'];
    }
    if (spec.intake === 'free-flow') {
      plant.airFilter.pressureDrop = k['air-filter-pressure-drop-aftermarket'];
    }
    let targetPressure = stock.induction.targetPressure.slice();
    if (spec.boost) {
      const boost = spec.boost;
      const from = boost.fullBoostRpm ?? fit.curve.start;
      targetPressure = stock.grid.map(
        (n) => options.air.pressure + boostAt(boost, Math.max(n, from), from, options.peakPowerRpm),
      );
    }
    if (spec.turbo) {
      const t = spec.turbo;
      const system: TurboSystem = {
        layout: t.count > 1 ? 'parallel' : 'single',
        units: Array.from({ length: t.count }, () => ({
          compressor: {
            chokeFlow: t.chokeFlow,
            maxPressureRatio: t.maxPressureRatio ?? k['turbo-default-max-pressure-ratio'],
            peakEfficiency: t.peakEfficiency ?? k['compressor-peak-efficiency'],
          },
          turbine: { flowCapacity: 0.1, efficiency: k['turbine-efficiency'] },
        })),
      };
      plant.system = system;
      sizeTurbine(
        model,
        plant,
        targetPressure,
        spec.boost?.fullBoostRpm ?? fit.curve.start,
        options,
        k,
      );
    }
    model.induction = { kind: 'turbo', plant, targetPressure };
    return model;
  }

  // Naturally aspirated.
  if (spec.intake === 'free-flow' || spec.exhaust !== 'stock') {
    applyNaBreathing(model, spec, options.air, k);
  }
  if (spec.supercharger) {
    model.induction = superchargerFor(model, spec.supercharger, options.air, k);
    model.lambda = k['wot-lambda-turbo'];
  }
  return model;
}

/**
 * Sizes a new turbo's turbine so the wastegate just closes at the documented
 * full-boost rpm: the smallest turbine that holds the target there.
 */
function sizeTurbine(
  model: EngineModel,
  plant: BoostPlant,
  targetPressure: number[],
  fullBoostRpm: number,
  options: BuildOptions,
  k: ModelConstants,
): void {
  const grid = model.grid;
  const i = Math.max(
    0,
    grid.findIndex((n) => n >= fullBoostRpm),
  );
  const rpm = grid[i] ?? fullBoostRpm;
  const target = targetPressure[i] ?? options.air.pressure;
  const perSecond = (model.volumePerRev * rpm) / 60;
  const ve = model.ve[i] ?? 1;
  const dryShare = 1 - options.air.vapourPressure / options.air.pressure;
  const gasoline = pumpGasoline(95, k);
  const demand = {
    rpm,
    air: options.air,
    targetPressure: target,
    airflow: (p: number, t: number) =>
      ((ve * p * dryShare) / (k['air-gas-constant'] * t)) * perSecond,
    // Sized at the stock map's retard: the tune's own timing isn't known until the sweep.
    turbineInletTemperature: (t: number) =>
      exhaustTemperature(
        {
          chargeTemperature: t,
          lambda: model.lambda,
          retardDeg: model.reference.knock.retard[i] ?? 0,
          rotary: model.rotary,
          fuel: gasoline,
        },
        k,
      ),
    exhaustPerAir: 1 + 1 / (model.lambda * gasoline.stoichAfr),
  };
  const surplus = (capacity: number) => {
    for (const u of plant.system.units) u.turbine.flowCapacity = capacity;
    return boostStateAt(plant, demand, target, k).turbineSurplus;
  };
  const capacity = bisect(surplus, 0.002, 5, 1e-6) ?? 0.2;
  for (const u of plant.system.units) u.turbine.flowCapacity = capacity * 0.999;
}

/**
 * Freer intake and exhaust on a naturally aspirated engine. The stock fit's
 * VE already includes the stock restrictions, so only the change counts, and
 * it grows with the square of airflow from nothing at idle to its full value
 * at peak power:
 * - intake: less pressure lost before the throttle means denser air at the valve;
 * - exhaust: less back pressure leaves less residual gas (the Livengood slope
 *   the turbo model uses) and takes less pumping work, counted here as VE.
 */
function applyNaBreathing(
  model: EngineModel,
  spec: SimBuildSpec,
  air: Atmosphere,
  k: ModelConstants,
): void {
  const intake =
    spec.intake === 'free-flow'
      ? k['na-intake-pressure-drop'] - k['na-intake-pressure-drop-aftermarket']
      : 0;
  const freer = {
    stock: k['na-exhaust-back-pressure'],
    'cat-back': k['na-exhaust-back-pressure-cat-back'],
    full: k['na-exhaust-back-pressure-headers'],
  };
  const exhaust = k['na-exhaust-back-pressure'] - freer[spec.exhaust];
  const flows = model.grid.map((n, i) => (model.ve[i] ?? 0) * n);
  const peakFlow = Math.max(...flows);
  const residualSlope = 1 / (k['air-gamma'] * (model.compressionRatio - 1));
  model.ve = model.ve.map((ve, i) => {
    const share = ((flows[i] ?? 0) / peakFlow) ** 2;
    const density = 1 + (intake * share) / air.pressure;
    // Pumping: back pressure x swept volume is work the piston no longer does,
    // about the same share of torque as of the charge's pressure.
    const breathing = 1 + ((residualSlope + 1) * exhaust * share) / air.pressure;
    return ve * density * breathing;
  });
}

/**
 * A centrifugal supercharger kit. Its pressure ratio rises with impeller tip
 * speed squared (supercharger.ts), so the documented boost at the documented
 * rpm sets the head coefficient for a nominal impeller; the kit's published
 * map (or the model's defaults) sets efficiency, surge and choke.
 */
function superchargerFor(
  model: EngineModel,
  kit: NonNullable<SimBuildSpec['supercharger']>,
  air: Atmosphere,
  k: ModelConstants,
): EngineModel['induction'] {
  if (kit.kind !== 'centrifugal') {
    throw new Error(`${kit.model}: only centrifugal kits are modelled for known builds so far.`);
  }
  const gamma = k['air-gamma'];
  const filterDrop = k['air-filter-pressure-drop-aftermarket'];
  const p1 = air.pressure - filterDrop;
  const pr = (air.pressure + kit.boost) / p1;
  const head = (Math.pow(pr, (gamma - 1) / gamma) - 1) * k['air-cp'] * air.temperature;
  const diameter = 0.1;
  const tip = (Math.PI * diameter * kit.boostRpm) / 60;
  // The engine's peak airflow unboosted, scaled by the kit's pressure ratio:
  // what the kit's filter and cooler are sized for.
  const rho = dryAirDensity(air, k);
  const naPeakFlow = Math.max(
    ...model.grid.map((n, i) => (model.ve[i] ?? 0) * rho * model.volumePerRev * (n / 60)),
  );
  const designFlow = naPeakFlow * pr;
  const charger: CentrifugalSupercharger = {
    kind: 'centrifugal',
    impellerDiameter: diameter,
    driveRatio: 1,
    headCoefficient: head / (tip * tip),
    map: {
      chokeFlow: kit.chokeFlow ?? k['supercharger-default-choke-flow'],
      maxPressureRatio: kit.maxPressureRatio ?? k['supercharger-default-max-pressure-ratio'],
      peakEfficiency: kit.peakEfficiency ?? k['compressor-peak-efficiency'],
    },
    driveEfficiency: k['supercharger-drive-efficiency'],
  };
  return {
    kind: 'supercharger',
    plant: {
      charger,
      intercooler: kit.intercooled
        ? {
            effectiveness: k['intercooler-effectiveness-aftermarket'],
            designFlow,
            pressureDrop: k['intercooler-pressure-drop-aftermarket'],
          }
        : { effectiveness: 0, designFlow, pressureDrop: 0 },
      airFilter: { designFlow, pressureDrop: filterDrop },
    },
  };
}
