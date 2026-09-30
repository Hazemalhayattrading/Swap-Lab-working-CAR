import type { DynoReport } from '../sim/report';
import type { UserConditions } from '../sim/simulate';
import type {
  BuildCountExceptionRow,
  CatalogueIndex,
  KnownBuildRow,
  WorkerRequest,
  WorkerResponse,
} from './sim-protocol';

export interface KnownBuildTable {
  builds: KnownBuildRow[];
  exceptions: BuildCountExceptionRow[];
  tolerance: number;
}

/**
 * The page's side of the simulation worker. Only the latest request matters:
 * an older result that arrives after a newer request was sent is dropped, so
 * quick clicks through trims never show a stale sheet.
 */
export class SimClient {
  private readonly worker: Worker;
  private nextId = 1;
  private latest = 0;
  private readonly pending = new Map<
    number,
    { resolve: (r: { report: DynoReport; ms: number }) => void; reject: (e: Error) => void }
  >();
  private readonly tables = new Map<
    number,
    { resolve: (t: KnownBuildTable) => void; reject: (e: Error) => void }
  >();
  private knownBuildTable: Promise<KnownBuildTable> | undefined;
  readonly ready: Promise<CatalogueIndex>;

  constructor() {
    this.worker = new Worker(new URL('./sim-worker.ts', import.meta.url), { type: 'module' });
    let resolveReady: (index: CatalogueIndex) => void = () => undefined;
    let rejectReady: (error: Error) => void = () => undefined;
    this.ready = new Promise<CatalogueIndex>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'ready') {
        resolveReady(message.index);
        return;
      }
      const table = this.tables.get(message.id);
      if (table) {
        this.tables.delete(message.id);
        if (message.type === 'known-builds')
          table.resolve({
            builds: message.builds,
            exceptions: message.exceptions,
            tolerance: message.tolerance,
          });
        else if (message.type === 'error') table.reject(new Error(message.message));
        return;
      }
      if (message.type === 'known-builds') return;
      const waiting = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (!waiting) return;
      if (message.type === 'error') waiting.reject(new Error(message.message));
      else waiting.resolve({ report: message.report, ms: message.ms });
    });
    this.worker.addEventListener('error', (event) => {
      const error = new Error(event.message || 'The simulation worker failed to start.');
      rejectReady(error);
      for (const waiting of this.pending.values()) waiting.reject(error);
      for (const waiting of this.tables.values()) waiting.reject(error);
      this.pending.clear();
      this.tables.clear();
    });
  }

  /** The known-build calibration table (BUILD_PROMPT 6.5), run once and kept. */
  knownBuilds(): Promise<KnownBuildTable> {
    this.knownBuildTable ??= new Promise<KnownBuildTable>((resolve, reject) => {
      const id = this.nextId++;
      this.tables.set(id, { resolve, reject });
      const request: WorkerRequest = { type: 'known-builds', id };
      this.worker.postMessage(request);
    });
    return this.knownBuildTable;
  }

  /** Resolves with the report, or with undefined if a newer request superseded it. */
  async simulate(
    carId: string,
    trimId: string,
    conditions: UserConditions,
  ): Promise<{ report: DynoReport; ms: number } | undefined> {
    const id = this.nextId++;
    this.latest = id;
    const request: WorkerRequest = { type: 'simulate', id, carId, trimId, conditions };
    const result = await new Promise<{ report: DynoReport; ms: number }>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(request);
    });
    return id === this.latest ? result : undefined;
  }
}
