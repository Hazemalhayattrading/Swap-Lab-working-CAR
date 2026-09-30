import type { Car, Trim } from './schema/car';
import type { Engine } from './schema/engine';
import { MODEL_UNITS, type AssumptionsFile } from './schema/model';
import type { FuelsFile, PowerRatingsFile, WeightBasesFile } from './schema/standards';
import type {
  Rated,
  ModelConstantId,
  SimAssumption,
  SimCar,
  SimCatalogue,
  SimEngine,
  SimRatingStandard,
  SimReportedLimit,
  SimVariant,
  SimWeight,
} from './sim-data';
import { toSI } from './units';

/**
 * Turns the sourced data files into the simulation's catalogue
 * (src/data/sim-data.ts): SI units, weights on one basis, and no sources,
 * notes or methods. Only this form reaches the site (the build's
 * `virtual:swaplab/catalogue` module); the files with their provenance stay in
 * the repository. Pure: the caller reads the files.
 */

export interface RawData {
  cars: readonly Car[];
  engines: readonly Engine[];
  powerRatings: PowerRatingsFile;
  fuels: FuelsFile;
  weightBases: WeightBasesFile;
  assumptions: AssumptionsFile;
}

type Measured<U extends string> = {
  value: number;
  unit: U;
  confidence: Rated['confidence'];
};

function rated(m: Measured<Parameters<typeof toSI>[1]>): Rated {
  return { value: toSI(m.value, m.unit), confidence: m.confidence };
}

function rpm(m: { value: number; confidence: Rated['confidence'] }): Rated {
  return { value: m.value, confidence: m.confidence };
}

/** "280 PS", "44.0 kgf·m": the figure as the source prints it. */
function printed(m: { value: number; unit: string }): string {
  const digits = m.unit === 'kgf·m' || !Number.isInteger(m.value) ? 1 : 0;
  return `${m.value.toFixed(digits)} ${m.unit}`;
}

function convertVariant(v: Engine['variants'][number]): SimVariant {
  const o = v.output;
  const curve = v.torqueCurve;
  const vvt = 'variableValveTiming' in v ? v.variableValveTiming.value : undefined;
  const vtec = 'camProfileSwitching' in v ? v.camProfileSwitching : undefined;
  return {
    id: v.id,
    name: v.name,
    markets: [...v.markets],
    period: { from: v.period.value.from, ...(v.period.value.to ? { to: v.period.value.to } : {}) },
    compressionRatio: {
      value: v.compressionRatio.value,
      confidence: v.compressionRatio.confidence,
    },
    induction: v.induction.value,
    turbos: (v.turbos ?? []).map((t) => ({ model: t.model.value, count: t.count })),
    ...(v.boost ? { boost: rated(v.boost) } : {}),
    ...(v.turboChangeover ? { turboChangeover: rpm(v.turboChangeover) } : {}),
    intercooler: v.intercooler.value,
    ...(v.injectorFlow ? { injectorFlow: rated(v.injectorFlow) } : {}),
    ...(v.secondaryInjectorFlow ? { secondaryInjectorFlow: rated(v.secondaryInjectorFlow) } : {}),
    ...(vvt ? { variableValveTiming: vvt } : {}),
    ...(vtec
      ? {
          camProfileSwitching: {
            valves: vtec.valves.value,
            ...(vtec.switchRpm ? { switchRpm: vtec.switchRpm.value } : {}),
          },
        }
      : {}),
    rating: {
      power: rated(o.power),
      powerRpm: rpm(o.powerRpm),
      torque: rated(o.torque),
      torqueRpm: rpm(o.torqueRpm),
      standard: o.standard,
      printed: { power: printed(o.power), torque: printed(o.torque) },
    },
    ...(curve
      ? {
          torqueCurve: curve.value.map(([n, t]) => ({
            rpm: n,
            torque: toSI(t, curve.unit as Parameters<typeof toSI>[1]),
          })),
        }
      : {}),
    ...(v.redline ? { redline: rpm(v.redline) } : {}),
    ...(v.revLimit ? { revLimit: rpm(v.revLimit) } : {}),
  };
}

function convertLimits(engine: Engine): SimReportedLimit[] {
  return (engine.internals?.reportedLimits ?? []).map((l) => ({
    component: l.component,
    quantity: l.quantity,
    value: l.quantity === 'rpm' ? rpm(l.value) : rated(l.value),
    context: l.context,
  }));
}

export function convertEngine(engine: Engine): SimEngine {
  const common = {
    id: engine.id,
    code: engine.code,
    manufacturer: engine.manufacturer,
    role: engine.role,
    displacement: { value: engine.displacement.value },
    firingOrder: [...engine.firingOrder.value],
    ...(engine.dryWeight ? { dryWeight: rated(engine.dryWeight) } : {}),
    reportedLimits: convertLimits(engine),
    variants: engine.variants.map(convertVariant),
  };
  if (engine.layout === 'rotary') {
    return { ...common, layout: 'rotary', rotors: engine.rotors };
  }
  return {
    ...common,
    layout: engine.layout,
    cylinders: engine.cylinders,
    bore: toSI(engine.bore.value, engine.bore.unit),
    stroke: toSI(engine.stroke.value, engine.stroke.unit),
    camLayout: engine.camLayout.value,
    valvesPerCylinder: engine.valvesPerCylinder.value,
  };
}

/** Headroom for bases that fill the tank to 90 %: tank sizes aren't in the data, ~10 % of 60-80 L. */
const PART_TANK_KG = 6;

/**
 * Normalises a published curb weight to full fuel and no driver (the JIS and
 * US convention). A basis that counts a driver has the driver's mass taken
 * off; one that doesn't say whether it does keeps the printed figure, with a
 * range down to "printed minus a driver".
 */
export function normaliseWeight(trim: Trim, bases: WeightBasesFile): SimWeight {
  const w = trim.curbWeight;
  const printedKg = toSI(w.value, w.unit);
  const basis = bases.bases.find((b) => b.id === w.basis);
  if (!basis) throw new Error(`No weight basis "${w.basis}"`);
  const driver = basis.driverMass ? toSI(basis.driverMass.value, basis.driverMass.unit) : 0;
  const tank = basis.fuelFill.value === 'full' ? 0 : PART_TANK_KG;
  let adjustmentKg = 0;
  let rangeKg: [number, number];
  if (basis.driverIncluded?.value === true) {
    adjustmentKg = -driver;
    rangeKg = [printedKg - driver, printedKg - driver + tank];
  } else if (basis.driverIncluded?.value === false) {
    rangeKg = [printedKg, printedKg + tank];
  } else {
    const typicalDriver = Math.max(
      0,
      ...bases.bases.map((b) => (b.driverMass ? toSI(b.driverMass.value, b.driverMass.unit) : 0)),
    );
    rangeKg = [printedKg - typicalDriver, printedKg + tank];
  }
  return {
    kg: printedKg + adjustmentKg,
    printedKg,
    basis: w.basis,
    adjustmentKg,
    rangeKg,
    confidence: w.confidence,
  };
}

export function convertCar(car: Car, bases: WeightBasesFile): SimCar {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    chassis: car.chassis,
    layout: car.layout,
    transmissions: car.transmissions.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      ratios: [...t.ratios.value],
    })),
    trims: car.trims.map((t) => ({
      id: t.id,
      name: t.name,
      market: t.market,
      period: {
        from: t.period.value.from,
        ...(t.period.value.to ? { to: t.period.value.to } : {}),
      },
      bodyStyle: t.bodyStyle,
      engine: { id: t.engine.id, variant: t.engine.variant },
      transmission: t.transmission,
      finalDrive: t.finalDrive.value,
      differential: t.differential.value,
      weight: normaliseWeight(t, bases),
      tyres: { front: t.tyres.front.value, rear: t.tyres.rear.value },
    })),
  };
}

function kelvin(m: { value: number; unit: '°C' | 'K' }): number {
  return m.unit === 'K' ? m.value : m.value + 273.15;
}

function pascal(m: { value: number; unit: 'kPa' | 'hPa' | 'mbar' }): number {
  return m.unit === 'kPa' ? m.value * 1000 : m.value * 100;
}

function convertStandards(file: PowerRatingsFile): SimRatingStandard[] {
  return file.standards.map((s) => {
    const confidences = [
      s.referenceTemperature.confidence,
      s.referencePressure.confidence,
      s.pressureBasis.confidence,
    ];
    const confidence = confidences.includes('estimated')
      ? 'estimated'
      : confidences.includes('single-source')
        ? 'single-source'
        : 'verified';
    return {
      id: s.id,
      name: s.name,
      temperature: kelvin(s.referenceTemperature),
      pressure: pascal(s.referencePressure),
      pressureBasis: s.pressureBasis.value,
      vapourPressure: pascal(s.referenceVapourPressure),
      confidence,
    };
  });
}

function convertAssumptions(file: AssumptionsFile): {
  constants: SimCatalogue['constants'];
  assumptions: SimAssumption[];
} {
  const constants = {} as Record<ModelConstantId, number>;
  const assumptions = file.assumptions.map((a) => {
    const value = a.value * MODEL_UNITS[a.unit];
    constants[a.id] = value;
    return {
      id: a.id,
      label: a.label,
      value,
      printed: a.unit === 'ratio' ? String(a.value) : `${String(a.value)} ${a.unit}`,
      confidence: a.confidence,
      kind: a.kind,
      sources: a.sources.map((s) => ({ title: s.title ?? s.url, url: s.url })),
    };
  });
  return { constants, assumptions };
}

export function buildCatalogue(raw: RawData): SimCatalogue {
  const { constants, assumptions } = convertAssumptions(raw.assumptions);
  return {
    cars: raw.cars.map((c) => convertCar(c, raw.weightBases)),
    engines: raw.engines.map(convertEngine),
    standards: convertStandards(raw.powerRatings),
    unknownStandard: raw.powerRatings.unknownStandard.map((u) => ({
      markets: [...u.markets],
      ...(u.from ? { from: u.from } : {}),
      ...(u.to ? { to: u.to } : {}),
      assume: u.assume,
    })),
    referenceFuels: raw.fuels.referenceFuels.map((f) => ({
      market: f.market,
      grade: f.grade,
      ron: f.ron.value,
      confidence: f.ron.confidence,
    })),
    pumpFuels: raw.fuels.pumpFuels.map((f) => ({
      id: f.id,
      name: f.name,
      ron: f.ron.value,
      confidence: f.ron.confidence,
    })),
    constants,
    assumptions,
  };
}
