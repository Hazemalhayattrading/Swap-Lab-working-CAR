import type { SimAssumption, SimPumpFuel, SimRatingStandard } from '../data/sim-data';
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
  pumpFuels: SimPumpFuel[];
  standards: SimRatingStandard[];
  assumptions: SimAssumption[];
  defaults: UserConditions;
  ambientPresets: readonly number[];
}

export type WorkerRequest = {
  type: 'simulate';
  id: number;
  carId: string;
  trimId: string;
  conditions: UserConditions;
};

export type WorkerResponse =
  | { type: 'ready'; index: CatalogueIndex }
  | { type: 'result'; id: number; report: DynoReport; ms: number }
  | { type: 'error'; id: number; message: string };
