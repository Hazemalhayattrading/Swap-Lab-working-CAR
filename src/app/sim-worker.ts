import catalogue from 'virtual:swaplab/catalogue';
import { gearboxLabel, toReport } from '../sim/report';
import { AMBIENT_PRESETS_C, DEFAULT_CONDITIONS, FitCache, simulateTrim } from '../sim/simulate';
import type { CatalogueIndex, WorkerRequest, WorkerResponse } from './sim-protocol';

/**
 * The simulation's Web Worker (CLAUDE.md rule 8): the 3D view never waits on
 * the numbers. Stock fits are cached per engine variant, so changing the
 * ambient or fuel only reruns the sweep.
 */

interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
}
const scope = self as unknown as WorkerScope;
const cache = new FitCache();

function period(p: { from: string; to?: string }): string {
  return p.to ? `${p.from} to ${p.to}` : `${p.from} on`;
}

function gearboxOf(t: Parameters<typeof gearboxLabel>[0] | undefined): string {
  return t ? gearboxLabel(t) : 'gearbox not on file';
}

const index: CatalogueIndex = {
  cars: catalogue.cars.map((car) => ({
    id: car.id,
    label: `${car.make} ${car.model} (${car.chassis})`,
    trims: car.trims.map((t) => ({
      id: t.id,
      label: t.name,
      market: t.market,
      period: period(t.period),
      gearbox: gearboxOf(car.transmissions.find((g) => g.id === t.transmission)),
    })),
  })),
  pumpFuels: catalogue.pumpFuels,
  standards: catalogue.standards,
  assumptions: catalogue.assumptions,
  defaults: DEFAULT_CONDITIONS,
  ambientPresets: AMBIENT_PRESETS_C,
};

scope.onmessage = (event) => {
  const request = event.data;
  const started = performance.now();
  try {
    const sim = simulateTrim(catalogue, request.carId, request.trimId, request.conditions, cache);
    scope.postMessage({
      type: 'result',
      id: request.id,
      report: toReport(sim, request.conditions),
      ms: performance.now() - started,
    });
  } catch (error) {
    scope.postMessage({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

scope.postMessage({ type: 'ready', index });
