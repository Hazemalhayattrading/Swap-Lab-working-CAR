import type { KnownBuild, KnownBuildsFile } from './schema/build';
import type { Car, Trim } from './schema/car';
import type { Engine } from './schema/engine';
import { MODEL_UNITS, type AssumptionsFile } from './schema/model';
import type {
  DynosFile,
  FuelsFile,
  LocationsFile,
  PowerRatingsFile,
  WeightBasesFile,
} from './schema/standards';
import type {
  Rated,
  ModelConstantId,
  SimAssumption,
  SimCar,
  SimCatalogue,
  SimCorrection,
  SimDyno,
  SimEngine,
  SimFuel,
  SimKnownBuild,
  SimLocation,
  SimRatingStandard,
  SimReportedLimit,
  SimStandardAtmosphere,
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
  locations: LocationsFile;
  dynos: DynosFile;
  builds: readonly KnownBuildsFile[];
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
    ...(v.exhaustBackPressure ? { exhaustBackPressure: rated(v.exhaustBackPressure) } : {}),
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
      ...(o.ratingFuelRon
        ? { fuelRon: { value: o.ratingFuelRon.value, confidence: o.ratingFuelRon.confidence } }
        : {}),
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
    ...(engine.oilCapacity
      ? { oilCapacity: toSI(engine.oilCapacity.value, engine.oilCapacity.unit) }
      : {}),
    ...(engine.cooling
      ? {
          cooling: {
            coolantCapacity: toSI(
              engine.cooling.coolantCapacity.value,
              engine.cooling.coolantCapacity.unit,
            ),
            ...(engine.cooling.oilCooler ? { oilCooler: engine.cooling.oilCooler.value } : {}),
          },
        }
      : {}),
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

function kelvin(m: { value: number; unit: '°C' | 'K' | '°F' }): number {
  if (m.unit === 'K') return m.value;
  if (m.unit === '°F') return ((m.value - 32) * 5) / 9 + 273.15;
  return m.value + 273.15;
}

function pascal(m: {
  value: number;
  unit: 'kPa' | 'hPa' | 'mbar' | 'inHg' | 'psi' | 'bar';
}): number {
  return toSI(m.value, m.unit);
}

/** The least sure of several confidences. */
function weakest(...confidences: Rated['confidence'][]): Rated['confidence'] {
  if (confidences.includes('estimated')) return 'estimated';
  if (confidences.includes('single-source')) return 'single-source';
  return 'verified';
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
    const value = a.unit === '°C' ? a.value + 273.15 : a.value * MODEL_UNITS[a.unit];
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

function convertFuels(file: FuelsFile): SimFuel[] {
  return file.fuels.map((f) => ({
    id: f.id,
    name: f.name,
    kind: f.kind,
    ron: f.ron.value,
    ...(f.lhv ? { lhv: toSI(f.lhv.value, f.lhv.unit) } : {}),
    ...(f.stoichAfr ? { stoichAfr: f.stoichAfr.value } : {}),
    ...(f.density ? { density: toSI(f.density.value, f.density.unit) } : {}),
    ...(f.heatOfVaporisation
      ? { heatOfVaporisation: toSI(f.heatOfVaporisation.value, f.heatOfVaporisation.unit) }
      : {}),
    ...(f.ethanolShare ? { ethanolShare: f.ethanolShare.value } : {}),
    needsTune: f.needsTune,
    availability: { status: f.availability.status, summary: f.availability.summary.value },
    confidence: weakest(
      f.ron.confidence,
      ...[f.lhv, f.stoichAfr, f.density, f.heatOfVaporisation]
        .filter((x) => x !== undefined)
        .map((x) => x.confidence),
    ),
  }));
}

function convertAtmosphere(file: LocationsFile): SimStandardAtmosphere {
  const a = file.standardAtmosphere;
  const seaLevelTemperature = kelvin(a.seaLevelTemperature);
  return {
    seaLevelPressure: pascal(a.seaLevelPressure),
    seaLevelTemperature,
    lapseRate: a.lapseRate.value,
    exponent: a.exponent.value,
  };
}

/** Pressure in the standard atmosphere at an elevation, Pa (the sim's standardPressure, for data). */
function isaPressure(elevation: number, isa: SimStandardAtmosphere): number {
  return (
    isa.seaLevelPressure *
    Math.pow(1 - (isa.lapseRate * elevation) / isa.seaLevelTemperature, isa.exponent)
  );
}

function convertLocations(file: LocationsFile, isa: SimStandardAtmosphere): SimLocation[] {
  return file.locations.map((l) => {
    const elevation = toSI(l.elevation.value, l.elevation.unit);
    return {
      id: l.id,
      name: l.name,
      label: l.label,
      elevation,
      pressure: isaPressure(elevation, isa),
      ...(l.summerStationPressure
        ? { summerStationPressure: pascal(l.summerStationPressure) }
        : {}),
      confidence: l.elevation.confidence,
    };
  });
}

function convertDynos(file: DynosFile): { dynos: SimDyno[]; corrections: SimCorrection[] } {
  return {
    dynos: file.dynos.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      readingFactor: { value: d.readingFactor.value, confidence: d.readingFactor.confidence },
      defaultCorrection: d.defaultCorrection.value,
    })),
    corrections: file.corrections.map((c) => {
      const t = c.referenceTemperature;
      const p = c.referencePressure;
      const basis = c.pressureBasis;
      const terms = [c.scale, c.offset, c.pressureExponent, c.temperatureExponent];
      const [scale, offset, pressureExponent, temperatureExponent] = terms;
      const reference =
        t && p && basis && scale && offset && pressureExponent && temperatureExponent
          ? {
              temperature: kelvin(t),
              pressure: pascal(p),
              pressureBasis: basis.value,
              scale: scale.value,
              offset: offset.value,
              pressureExponent: pressureExponent.value,
              temperatureExponent: temperatureExponent.value,
            }
          : undefined;
      return {
        id: c.id,
        name: c.name,
        ...(reference ? { reference } : {}),
        confidence: weakest(
          c.formula.confidence,
          ...terms.filter((x) => x !== undefined).map((x) => x.confidence),
        ),
      };
    }),
  };
}

/**
 * A map's corrected flow re-referenced to the model's inlet (298.15 K,
 * 101.325 kPa). A flow quoted without its reference is taken as given.
 */
function toModelCorrectedFlow(
  flow: { value: number; unit: 'lb/min' | 'kg/s' },
  temperature?: { value: number; unit: '°C' | '°F' | 'K' },
  pressure?: { value: number; unit: 'kPa' | 'psi' | 'inHg' | 'bar' },
): number {
  const t = temperature ? kelvin(temperature) : 298.15;
  const p = pressure ? pascal(pressure) : 101_325;
  return toSI(flow.value, flow.unit) * Math.sqrt(t / 298.15) * (101_325 / p);
}

function convertBuild(
  carId: string,
  b: KnownBuild,
  dynos: SimDyno[],
  isa: SimStandardAtmosphere,
): SimKnownBuild {
  const m = b.modifications;
  const r = b.result;
  const dyno = dynos.find((d) => d.id === r.dyno.value);
  if (!dyno) throw new Error(`${b.id}: no dyno "${r.dyno.value}"`);
  const stated = r.correction.value;
  const c = r.conditions;
  const conditionsPressure = c?.pressure
    ? pascal(c.pressure)
    : c?.elevation
      ? isaPressure(toSI(c.elevation.value, c.elevation.unit), isa)
      : undefined;
  const sc = m.supercharger;
  return {
    id: b.id,
    carId,
    trimId: b.trim,
    title: b.title,
    who: b.who,
    ...(b.date ? { date: b.date } : {}),
    spec: {
      ...(m.boost
        ? {
            boost: {
              peak: toSI(m.boost.peak.value, m.boost.peak.unit),
              ...(m.boost.atPeakPower
                ? { atPeakPower: toSI(m.boost.atPeakPower.value, m.boost.atPeakPower.unit) }
                : {}),
              ...(m.boost.fullBoostRpm ? { fullBoostRpm: m.boost.fullBoostRpm.value } : {}),
            },
          }
        : {}),
      ...(m.turbo
        ? {
            turbo: {
              model: m.turbo.model.value,
              count: m.turbo.count,
              chokeFlow: toModelCorrectedFlow(
                m.turbo.compressorMaxFlow,
                m.turbo.mapReferenceTemperature,
                m.turbo.mapReferencePressure,
              ),
              ...(m.turbo.maxPressureRatio
                ? { maxPressureRatio: m.turbo.maxPressureRatio.value }
                : {}),
              ...(m.turbo.peakEfficiency ? { peakEfficiency: m.turbo.peakEfficiency.value } : {}),
            },
          }
        : {}),
      ...(sc
        ? {
            supercharger: {
              model: sc.model.value,
              kind: sc.kind,
              boost: toSI(sc.boost.value, sc.boost.unit),
              boostRpm: sc.boostRpm.value,
              intercooled: sc.intercooled.value,
              ...(sc.peakEfficiency ? { peakEfficiency: sc.peakEfficiency.value } : {}),
              ...(sc.compressorMaxFlow
                ? {
                    chokeFlow: toModelCorrectedFlow(
                      sc.compressorMaxFlow,
                      sc.mapReferenceTemperature,
                      sc.mapReferencePressure,
                    ),
                  }
                : {}),
              ...(sc.maxPressureRatio ? { maxPressureRatio: sc.maxPressureRatio.value } : {}),
            },
          }
        : {}),
      intercooler: m.intercooler.value,
      exhaust: m.exhaust.value,
      intake: m.intake.value,
      ecu: m.ecu.value,
      fuel: {
        kind: m.fuel.kind,
        ron: m.fuel.ron.value,
        ...(m.fuel.fuelId ? { id: m.fuel.fuelId } : {}),
      },
      ...(m.injectors
        ? {
            injectorFlow:
              m.injectors.value === 'unstated'
                ? ('unstated' as const)
                : toSI(m.injectors.value, m.injectors.unit),
          }
        : {}),
      ...(m.secondaryInjectors
        ? {
            secondaryInjectorFlow: toSI(m.secondaryInjectors.value, m.secondaryInjectors.unit),
          }
        : {}),
      camshafts: m.camshafts.value,
    },
    described: m.described,
    result: {
      wheelPower: {
        value: toSI(r.wheelPower.value, r.wheelPower.unit),
        confidence: r.wheelPower.confidence,
      },
      printed: `${printed(r.wheelPower)} at the wheels`,
      ...(r.powerRpm ? { powerRpm: r.powerRpm.value } : {}),
      dyno: dyno.id,
      correction: stated === 'not-stated' ? dyno.defaultCorrection : stated,
      correctionAssumed: stated === 'not-stated',
      ...(c && conditionsPressure !== undefined
        ? {
            conditions: {
              temperature: kelvin(c.temperature),
              pressure: conditionsPressure,
              ...(c.relativeHumidity ? { relativeHumidity: c.relativeHumidity.value } : {}),
            },
          }
        : {}),
      ...(r.gear ? { gear: r.gear.value } : {}),
    },
    source: { title: b.sources[0]?.title ?? b.sources[0]?.url ?? '', url: b.sources[0]?.url ?? '' },
    ...(b.excluded ? { excluded: { reason: b.excluded.reason, decided: b.excluded.decided } } : {}),
    scoring:
      b.scoring.sample === 'fit'
        ? { sample: 'fit', fitted: b.scoring.fitted }
        : {
            sample: 'holdout',
            firstError: b.scoring.firstScore.error,
            scored: b.scoring.firstScore.scored,
            commit: b.scoring.firstScore.commit,
          },
  };
}

export function buildCatalogue(raw: RawData): SimCatalogue {
  const { constants, assumptions } = convertAssumptions(raw.assumptions);
  const atmosphere = convertAtmosphere(raw.locations);
  const { dynos, corrections } = convertDynos(raw.dynos);
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
    fuels: convertFuels(raw.fuels),
    defaultFuel: raw.fuels.defaultFuel,
    atmosphere,
    locations: convertLocations(raw.locations, atmosphere),
    defaultLocation: raw.locations.defaultLocation,
    dynos,
    corrections,
    knownBuilds: raw.builds.flatMap((file) =>
      file.builds.map((b) => convertBuild(file.car, b, dynos, atmosphere)),
    ),
    buildCountExceptions: raw.builds.flatMap((file) => {
      const e = file.buildCountException;
      return e
        ? [
            {
              carId: file.car,
              minBuilds: e.minBuilds,
              reason: e.reason,
              decided: e.decided,
              badge: e.badge,
            },
          ]
        : [];
    }),
    constants,
    assumptions,
  };
}
