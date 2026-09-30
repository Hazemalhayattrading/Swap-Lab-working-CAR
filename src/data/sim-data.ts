/**
 * The simulation's copy of the data: SI units, no sources, notes or methods.
 *
 * `src/data/loader/` builds this from the sourced data files, and the build
 * ships only this form to the site (the files with their sources are about
 * 7.8 MB). Every value keeps its confidence where the UI has to say it's
 * estimated (BUILD_PROMPT section 2). This module has no imports, so the
 * simulation can use it without pulling in the Zod schemas.
 */

export type Confidence = 'verified' | 'single-source' | 'estimated';

/** A value with its confidence, for fields the UI flags. */
export interface Rated<T = number> {
  value: T;
  confidence: Confidence;
}

export type RatingStandardId =
  'JIS-net' | 'SAE-net' | 'DIN-70020' | 'EEC-80/1269' | 'ADR' | 'unknown';

export type Market = 'JDM' | 'USDM' | 'CDM' | 'EUDM' | 'UKDM' | 'AUDM' | 'NZDM' | 'other';

export type Induction =
  'naturally-aspirated' | 'single-turbo' | 'twin-turbo-sequential' | 'twin-turbo-parallel';

export type Intercooler = 'none' | 'air-to-air-front' | 'air-to-air-side' | 'air-to-water';

/** A factory rating in SI, with the figures as printed for display. */
export interface SimRating {
  /** W, crank, net. */
  power: Rated;
  powerRpm: Rated;
  /** N·m, crank, net. */
  torque: Rated;
  torqueRpm: Rated;
  standard: RatingStandardId;
  /** As the source prints them, e.g. "280 PS" and "44.0 kgf·m". */
  printed: { power: string; torque: string };
  /** RON the figure was rated on, where the maker says (else the market's rating fuel). */
  fuelRon?: Rated;
}

export interface SimVariant {
  id: string;
  name: string;
  markets: Market[];
  period: { from: string; to?: string };
  compressionRatio: Rated;
  induction: Induction;
  turbos: { model: string; count: number }[];
  /** Stock peak boost, Pa gauge. */
  boost?: Rated;
  /** Sequential twin turbos: full-load rpm at which the second turbo comes on. */
  turboChangeover?: Rated;
  intercooler: Intercooler;
  /** Pa: the factory exhaust's back pressure after the turbine at the stock peak flow, where known. */
  exhaustBackPressure?: Rated;
  /** m³/s per injector (the primary, with staged fuelling). */
  injectorFlow?: Rated;
  /** m³/s per secondary injector (staged fuelling, e.g. the 13B-REW). */
  secondaryInjectorFlow?: Rated;
  variableValveTiming?: string;
  camProfileSwitching?: { valves: string; switchRpm?: number };
  rating: SimRating;
  /** The maker's published full-load torque curve, N·m, rising rpm. */
  torqueCurve?: { rpm: number; torque: number }[];
  redline?: Rated;
  revLimit?: Rated;
}

/** A published "the stock part holds about this much" figure (engine internals). */
export interface SimReportedLimit {
  component: string;
  quantity: 'crank-power' | 'wheel-power' | 'torque' | 'rpm';
  /** W, N·m or rpm, matching `quantity`. */
  value: Rated;
  context: string;
}

interface SimEngineCommon {
  id: string;
  code: string;
  manufacturer: string;
  role: 'launch-swap' | 'stock-only';
  /** cc, as the maker states it; src/data/displacement.ts turns it into airflow. */
  displacement: { value: number };
  firingOrder: number[];
  dryWeight?: Rated;
  /** m³ of oil, with the filter. */
  oilCapacity?: number;
  /** The factory cooling system of the car it came in (m³ of coolant). */
  cooling?: { coolantCapacity: number; oilCooler?: 'oil-to-water' | 'oil-to-air' | 'none' };
  reportedLimits: SimReportedLimit[];
  variants: SimVariant[];
}

export interface SimPistonEngine extends SimEngineCommon {
  layout: 'inline' | 'V' | 'flat';
  cylinders: number;
  /** m */
  bore: number;
  /** m */
  stroke: number;
  camLayout: 'DOHC' | 'SOHC' | 'OHV';
  valvesPerCylinder: number;
}

export interface SimRotaryEngine extends SimEngineCommon {
  layout: 'rotary';
  rotors: number;
}

export type SimEngine = SimPistonEngine | SimRotaryEngine;

export type TransmissionType = 'manual' | 'automatic' | 'automated-manual';

export interface SimTransmission {
  id: string;
  name: string;
  type: TransmissionType;
  ratios: number[];
}

/**
 * How a curb weight was published. The loader normalises every basis to the
 * JIS / US convention: full fuel and fluids, no driver.
 */
export type WeightBasis =
  | 'jis-vehicle-weight'
  | 'us-curb-weight'
  | 'din-kerb-weight'
  | 'eu-mass-in-running-order'
  | 'kerb-no-driver'
  | 'au-kerb-mass'
  | 'unstated';

export interface SimWeight {
  /** kg, normalised: full fuel and fluids, no driver. */
  kg: number;
  /** kg, as the source prints it (converted from lb where needed). */
  printedKg: number;
  basis: WeightBasis;
  /** kg added to the printed figure to normalise it (e.g. -75 for a 75 kg driver). */
  adjustmentKg: number;
  /**
   * [low, high] kg the normalised weight could be, given what its basis leaves
   * open: a partly filled tank, or (basis unstated) a driver that may be in it.
   */
  rangeKg: [number, number];
  confidence: Confidence;
}

export interface SimTrim {
  id: string;
  name: string;
  market: Market;
  period: { from: string; to?: string };
  bodyStyle: string;
  engine: { id: string; variant: string };
  transmission: string;
  finalDrive: number;
  differential: string;
  weight: SimWeight;
  tyres: { front: string; rear: string };
}

export interface SimCar {
  id: string;
  make: string;
  model: string;
  chassis: string;
  layout: 'FR' | 'MR' | 'RR' | 'FF' | 'AWD';
  transmissions: SimTransmission[];
  trims: SimTrim[];
}

/** Reference atmosphere of a power rating standard, in SI. */
export interface SimRatingStandard {
  id: Exclude<RatingStandardId, 'unknown'>;
  name: string;
  /** K */
  temperature: number;
  /** Pa; `pressureBasis` says whether it is total barometric or dry-air pressure. */
  pressure: number;
  pressureBasis: 'total' | 'dry-air';
  /** Pa of water vapour assumed at the reference, for standards that give total pressure. */
  vapourPressure: number;
  confidence: Confidence;
}

/** A pump fuel the factory figures were rated on, by market. */
export interface SimReferenceFuel {
  market: Market;
  grade: string;
  ron: number;
  confidence: Confidence;
}

export type FuelAvailability = 'pump-nationwide' | 'pump-some-stations' | 'drum' | 'not-sold';

/** A fuel the user can choose: Saudi pump grades, race fuel, E85. SI units. */
export interface SimFuel {
  id: string;
  name: string;
  kind: 'pump-gasoline' | 'race-gasoline' | 'e85';
  ron: number;
  /** J/kg; undefined means gasoline's (model constants). */
  lhv?: number;
  stoichAfr?: number;
  /** kg/m³ */
  density?: number;
  /** J/kg */
  heatOfVaporisation?: number;
  ethanolShare?: number;
  needsTune: boolean;
  availability: { status: FuelAvailability; summary: string };
  confidence: Confidence;
}

/** An altitude preset (standards/locations.json). */
export interface SimLocation {
  id: string;
  name: string;
  label: string;
  /** m above sea level. */
  elevation: number;
  /** Pa, International Standard Atmosphere at that elevation. */
  pressure: number;
  /** Pa, mean summer station pressure where a climate record gives one. */
  summerStationPressure?: number;
  confidence: Confidence;
}

/** The International Standard Atmosphere, for pressure at an elevation. */
export interface SimStandardAtmosphere {
  /** Pa */
  seaLevelPressure: number;
  /** K */
  seaLevelTemperature: number;
  /** K/m */
  lapseRate: number;
  /** g0 M / (R L), about 5.256. */
  exponent: number;
}

export type DynoId =
  'dynojet' | 'mustang' | 'dynapack' | 'dyno-dynamics' | 'mainline' | 'superflow' | 'rototest';

export interface SimDyno {
  id: DynoId;
  name: string;
  kind: 'inertia-roller' | 'load-roller' | 'hub';
  /** Reading on this dyno for a car a Dynojet reads 1.00 on. */
  readingFactor: Rated;
  /** The correction its software applies unless told otherwise. */
  defaultCorrection: CorrectionId;
}

export type CorrectionId =
  'sae-j1349' | 'sae-j607-std' | 'din-70020' | 'eec-80-1269' | 'uncorrected';

/** cf = scale x (pRef / p)^pressureExponent x (T / TRef)^temperatureExponent - offset. */
export interface SimCorrection {
  id: CorrectionId;
  name: string;
  /** Undefined for `uncorrected`. */
  reference?: {
    /** K */
    temperature: number;
    /** Pa */
    pressure: number;
    pressureBasis: 'dry-air' | 'total';
    scale: number;
    offset: number;
    pressureExponent: number;
    temperatureExponent: number;
  };
  confidence: Confidence;
}

/** Which standard the calibration assumes for figures whose standard isn't printed. */
export interface SimUnknownStandardRule {
  markets: Market[];
  /** Window on the variant's first sale month (inclusive, compared at shared precision). */
  from?: string;
  to?: string;
  assume: Exclude<RatingStandardId, 'unknown'>;
}

/** Every number the model itself assumes (not car data). See src/data/model/assumptions.json. */
export const MODEL_CONSTANT_IDS = [
  // Gas properties
  'air-gas-constant',
  'vapour-gas-constant',
  'air-cp',
  'air-gamma',
  'exhaust-cp',
  'exhaust-gamma',
  // Fuel
  'gasoline-lhv',
  'gasoline-stoich-afr',
  'gasoline-density',
  'gasoline-heat-of-vaporisation',
  'charge-cooling-share',
  // Mixture and efficiency
  'wot-lambda-na',
  'wot-lambda-turbo',
  'wot-lambda-rotary-turbo',
  'wot-lambda-rotary-tuned',
  'lambda-peak-work',
  'lambda-peak-work-gain',
  'cycle-gamma',
  'indicated-efficiency-scale-piston',
  'indicated-efficiency-scale-rotary',
  // Breathing
  've-temperature-exponent',
  // Friction
  'fmep-piston-a',
  'fmep-piston-b',
  'fmep-piston-c',
  'fmep-rotary-a',
  'fmep-rotary-b',
  'fmep-rotary-c',
  // Knock
  'knock-retard-per-octane',
  'knock-octane-per-kelvin',
  'knock-octane-per-kpa',
  'knock-loss-quadratic',
  'knock-loss-linear-from',
  'knock-stock-retard-na',
  'knock-stock-retard-boosted',
  'knock-max-retard',
  // Forced induction
  'compressor-peak-efficiency',
  'turbine-efficiency',
  'turbo-mechanical-efficiency',
  'turbo-stock-turbine-margin',
  'compressor-stock-choke-position',
  'compressor-stock-pr-fraction',
  'intercooler-effectiveness-side',
  'intercooler-effectiveness-front',
  'intercooler-effectiveness-water',
  'intercooler-pressure-drop',
  'air-filter-pressure-drop',
  'exhaust-back-pressure',
  // Aftermarket parts, as a known build or (Phase 3) a user's build fits them
  'intercooler-effectiveness-aftermarket',
  'intercooler-aftermarket-flow-scale',
  'intercooler-pressure-drop-aftermarket',
  'exhaust-back-pressure-cat-back',
  'exhaust-back-pressure-turbo-back',
  'air-filter-pressure-drop-aftermarket',
  'na-intake-pressure-drop',
  'na-intake-pressure-drop-aftermarket',
  'na-exhaust-back-pressure',
  'na-exhaust-back-pressure-cat-back',
  'na-exhaust-back-pressure-headers',
  'turbo-default-max-pressure-ratio',
  'supercharger-default-choke-flow',
  'supercharger-default-max-pressure-ratio',
  'supercharger-drive-efficiency',
  'egt-fraction-piston',
  'egt-fraction-rotary',
  'egt-fraction-per-degree',
  // Drivetrain
  'drivetrain-manual-direct',
  'drivetrain-manual-indirect',
  'drivetrain-automatic',
  'drivetrain-automated-manual',
  'drivetrain-final-drive',
  'drivetrain-tyre-roller',
  // Thermal model and the heat-soak test (BUILD_PROMPT 6.2)
  'heat-to-coolant-piston',
  'heat-to-coolant-rotary',
  'heat-to-oil-piston',
  'heat-to-oil-rotary',
  'radiator-design-coolant',
  'radiator-design-ambient',
  'radiator-design-face-velocity',
  'radiator-velocity-exponent',
  'oil-design-over-coolant',
  'engine-default-mass',
  'engine-thermal-mass-share',
  'engine-metal-specific-heat',
  'coolant-default-volume',
  'oil-default-volume',
  'coolant-density',
  'coolant-specific-heat',
  'oil-density',
  'oil-specific-heat',
  'thermostat-open',
  'thermostat-span',
  'oil-start-over-coolant',
  'drift-load-low',
  'drift-load-high',
  'drift-load-period',
  'drift-duration',
  'drift-face-velocity',
  'coolant-limit',
  'oil-limit',
  // Known builds
  'dyno-default-relative-humidity',
  // Limits
  'injector-duty-limit',
  // Stock curve shape, where the maker publishes only the peaks
  'idle-rpm',
  'sweep-margin-rpm',
  'na-idle-torque-fraction',
  'na-idle-slope-factor',
  'turbo-spool-offset-rpm',
  'turbo-spool-torque-fraction',
  'power-drop-na',
  'power-drop-boosted',
  've-prior-peak-boosted',
  've-prior-low-droop',
  've-prior-high-droop',
  'sequential-changeover-fraction',
  // Uncertainty band
  'band-rating-tolerance',
  'band-standard-unknown',
  'band-shape-na',
  'band-shape-boosted',
  'band-spool',
  'band-shape-distance',
  'band-per-kelvin',
  'band-per-octane',
] as const;
export type ModelConstantId = (typeof MODEL_CONSTANT_IDS)[number];
export type ModelConstants = Readonly<Record<ModelConstantId, number>>;

/** A model assumption as the "How we calculate this" drawer lists it. */
export interface SimAssumption {
  id: ModelConstantId;
  label: string;
  /** SI value, as the model uses it. */
  value: number;
  /** Display value and unit as the source prints it, e.g. "43.4 MJ/kg". */
  printed: string;
  confidence: Confidence;
  kind: 'physics' | 'literature' | 'model-choice';
  sources: { title: string; url: string }[];
}

/** An aftermarket turbo, from its maker's compressor map. */
export interface SimTurboSpec {
  model: string;
  count: number;
  /**
   * kg/s at the map's choke line at the top of the map, corrected to the
   * model's reference inlet (298.15 K, 101.325 kPa), per turbo.
   */
  chokeFlow: number;
  /** Undefined where no map is published: the model's defaults apply. */
  maxPressureRatio?: number;
  peakEfficiency?: number;
}

/** A supercharger kit on a naturally aspirated engine. */
export interface SimSuperchargerSpec {
  model: string;
  kind: 'centrifugal' | 'twin-screw' | 'roots';
  /** Pa gauge the kit makes at `boostRpm` (engine rpm), as documented. */
  boost: number;
  boostRpm: number;
  intercooled: boolean;
  /** From the maker's map where published (else model defaults). */
  peakEfficiency?: number;
  chokeFlow?: number;
  maxPressureRatio?: number;
}

/** What a build changes, as the simulation applies it. SI units. */
export interface SimBuildSpec {
  /** Gauge boost the controller holds, Pa, as documented on the dyno day. */
  boost?: { peak: number; atPeakPower?: number; fullBoostRpm?: number };
  turbo?: SimTurboSpec;
  supercharger?: SimSuperchargerSpec;
  /** `aftermarket`: a bigger air-to-air core, front-mount or in the stock place. */
  intercooler: 'stock' | 'aftermarket';
  /**
   * `cat-back`: silencers and pipes after the catalyst. `full`: headers (naturally
   * aspirated) or a downpipe (turbo) as well, with or without a catalyst.
   */
  exhaust: 'stock' | 'cat-back' | 'full';
  intake: 'stock' | 'free-flow';
  ecu: 'stock' | 'tuned';
  fuel: { kind: SimFuel['kind']; ron: number; id?: string };
  /**
   * m³/s per injector (primaries), where the build changed them; `unstated`
   * for bigger injectors of a size the source doesn't give (fuel not limited).
   */
  injectorFlow?: number | 'unstated';
  /** m³/s per secondary injector (staged fuelling), where the build changed them. */
  secondaryInjectorFlow?: number;
  camshafts: 'stock' | 'aftermarket';
}

/**
 * A documented real build with a published chassis-dyno result
 * (src/data/builds/): the known-build calibration checks the model against it.
 */
export interface SimKnownBuild {
  id: string;
  carId: string;
  trimId: string;
  title: string;
  /** Owner, shop or magazine. */
  who: string;
  /** When it was on the dyno (YYYY, YYYY-MM or a date), where the source says. */
  date?: string;
  spec: SimBuildSpec;
  /** The parts list as documented, for people. */
  described: string;
  result: {
    /** W at the wheels, as printed (converted to W). */
    wheelPower: Rated;
    printed: string;
    powerRpm?: number;
    dyno: DynoId;
    correction: CorrectionId;
    /** The sheet doesn't say: the dyno software's default is assumed. */
    correctionAssumed: boolean;
    /** Test-day air, where the sheet prints it. */
    conditions?: { temperature: number; pressure: number; relativeHumidity?: number };
    gear?: number;
  };
  source: { title: string; url: string };
  /** Out of the 10 % gate, with the reason (see src/data/schema/build.ts). */
  excluded?: { reason: string; decided: string };
  scoring: SimBuildScoring;
}

/**
 * Whether a build helped choose the model's fitted constants (`fit`: its score
 * is in-sample) or was added later and first scored out-of-sample (`holdout`,
 * with that first score kept). See src/data/schema/build.ts.
 */
export type SimBuildScoring =
  | { sample: 'fit'; fitted: string }
  | { sample: 'holdout'; firstError: number; scored: string; commit: string };

/** Counted known builds every launch car needs (the owner: at least three per car). */
export const MIN_KNOWN_BUILDS_PER_CAR = 3;

/** The owner's exception to the three-builds-per-car rule, for one car. */
export interface SimBuildCountException {
  carId: string;
  minBuilds: number;
  reason: string;
  decided: string;
  /** What the car's stock-check sticker says about the gap. */
  badge: string;
}

export interface SimCatalogue {
  cars: SimCar[];
  engines: SimEngine[];
  standards: SimRatingStandard[];
  unknownStandard: SimUnknownStandardRule[];
  referenceFuels: SimReferenceFuel[];
  fuels: SimFuel[];
  defaultFuel: string;
  atmosphere: SimStandardAtmosphere;
  locations: SimLocation[];
  defaultLocation: string;
  dynos: SimDyno[];
  corrections: SimCorrection[];
  knownBuilds: SimKnownBuild[];
  buildCountExceptions: SimBuildCountException[];
  constants: ModelConstants;
  assumptions: SimAssumption[];
}
