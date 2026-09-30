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

/** A pump fuel the user can choose (part 2a: gasoline by RON). */
export interface SimPumpFuel {
  id: string;
  name: string;
  ron: number;
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
  // Mixture and efficiency
  'wot-lambda-na',
  'wot-lambda-turbo',
  'wot-lambda-rotary-turbo',
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
  // Forced induction
  'compressor-peak-efficiency',
  'turbine-efficiency',
  'turbo-mechanical-efficiency',
  'compressor-stock-choke-position',
  'compressor-stock-pr-fraction',
  'intercooler-effectiveness-side',
  'intercooler-effectiveness-front',
  'intercooler-effectiveness-water',
  'intercooler-pressure-drop',
  'air-filter-pressure-drop',
  'exhaust-back-pressure',
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

export interface SimCatalogue {
  cars: SimCar[];
  engines: SimEngine[];
  standards: SimRatingStandard[];
  unknownStandard: SimUnknownStandardRule[];
  referenceFuels: SimReferenceFuel[];
  pumpFuels: SimPumpFuel[];
  constants: ModelConstants;
  assumptions: SimAssumption[];
}
