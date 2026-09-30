import type {
  SimAssumption,
  SimFuel,
  SimLocation,
  SimRatingStandard,
  SimStandardAtmosphere,
} from '../data/sim-data';
import type { DynoReport } from '../sim/report';
import type { UserConditions } from '../sim/simulate';

/** Messages between the page and the simulation worker (src/app/sim-worker.ts). */

/** The pickers' view of the catalogue, sent once when the worker starts. */
export interface CatalogueIndex {
  cars: {
    id: string;
    label: string;
    trims: { id: string; label: string; market: string; period: string; gearbox: string }[];
  }[];
  /** Pump grades, race fuel and E85, with where each is sold. */
  fuels: SimFuel[];
  /** Altitude presets; `custom` takes an elevation through `atmosphere`. */
  locations: SimLocation[];
  atmosphere: SimStandardAtmosphere;
  elevationRange: readonly [number, number];
  standards: SimRatingStandard[];
  assumptions: SimAssumption[];
  defaults: UserConditions;
  ambientPresets: readonly number[];
}

/** One known build and how the model did on it, for the drawer's table. */
export interface KnownBuildRow {
  id: string;
  car: string;
  title: string;
  who: string;
  date?: string;
  dyno: string;
  correction: string;
  /** The sheet doesn't say; the dyno's usual correction is assumed. */
  correctionAssumed: boolean;
  /** W at the wheels, as the sheet prints it and as the model predicts it for that dyno. */
  measured: number;
  predicted: number;
  error: number;
  pass: boolean;
  source: { title: string; url: string };
  /** Out of the 10 % gate: why (src/data/schema/build.ts). */
  excluded?: string;
}

export type WorkerRequest =
  | {
      type: 'simulate';
      id: number;
      carId: string;
      trimId: string;
      conditions: UserConditions;
    }
  | { type: 'known-builds'; id: number };

export type WorkerResponse =
  | { type: 'ready'; index: CatalogueIndex }
  | { type: 'result'; id: number; report: DynoReport; ms: number }
  | { type: 'known-builds'; id: number; builds: KnownBuildRow[]; tolerance: number }
  | { type: 'error'; id: number; message: string };
