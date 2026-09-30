import type { DynoReport } from '../sim/report';
import type { UserConditions } from '../sim/simulate';
import type { CatalogueIndex, WorkerRequest, WorkerResponse } from './sim-protocol';

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
      this.pending.clear();
    });
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
