import catalogue from 'virtual:swaplab/catalogue';
import { KNOWN_BUILD_TOLERANCE, simulateKnownBuild } from '../sim/known-builds';
import { gearboxLabel, toReport } from '../sim/report';
import {
  AMBIENT_PRESETS_C,
  ELEVATION_RANGE_M,
  FitCache,
  defaultConditions,
  simulateTrim,
} from '../sim/simulate';
import type { CatalogueIndex, KnownBuildRow, WorkerRequest, WorkerResponse } from './sim-protocol';

/**
 * The simulation's Web Worker (CLAUDE.md rule 8): the 3D view never waits on
 * the numbers. Stock fits are cached per engine variant, so changing the
 * ambient, the altitude or the fuel only reruns the sweep.
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

const carLabel = (car: (typeof catalogue.cars)[number]) =>
  `${car.make} ${car.model} (${car.chassis})`;

const index: CatalogueIndex = {
  cars: catalogue.cars.map((car) => ({
    id: car.id,
    label: carLabel(car),
    trims: car.trims.map((t) => ({
      id: t.id,
      label: t.name,
      market: t.market,
      period: period(t.period),
      gearbox: gearboxOf(car.transmissions.find((g) => g.id === t.transmission)),
    })),
  })),
  fuels: catalogue.fuels,
  locations: catalogue.locations,
  atmosphere: catalogue.atmosphere,
  elevationRange: ELEVATION_RANGE_M,
  standards: catalogue.standards,
  assumptions: catalogue.assumptions,
  defaults: defaultConditions(catalogue),
  ambientPresets: AMBIENT_PRESETS_C,
};

let knownBuilds: KnownBuildRow[] | undefined;

function knownBuildRows(): KnownBuildRow[] {
  knownBuilds ??= catalogue.knownBuilds.map((build) => {
    const r = simulateKnownBuild(catalogue, build, cache);
    const car = catalogue.cars.find((c) => c.id === build.carId);
    const dyno = catalogue.dynos.find((d) => d.id === build.result.dyno);
    const correction = catalogue.corrections.find((c) => c.id === build.result.correction);
    return {
      id: build.id,
      car: car ? carLabel(car) : build.carId,
      title: build.title,
      who: build.who,
      ...(build.date ? { date: build.date } : {}),
      dyno: dyno?.name ?? build.result.dyno,
      correction: correction?.name ?? build.result.correction,
      correctionAssumed: build.result.correctionAssumed,
      measured: r.measured,
      predicted: r.predicted,
      error: r.error,
      pass: r.pass,
      source: build.source,
      ...(build.excluded ? { excluded: build.excluded.reason } : {}),
    };
  });
  return knownBuilds;
}

scope.onmessage = (event) => {
  const request = event.data;
  const started = performance.now();
  try {
    if (request.type === 'known-builds') {
      scope.postMessage({
        type: 'known-builds',
        id: request.id,
        builds: knownBuildRows(),
        tolerance: KNOWN_BUILD_TOLERANCE,
      });
      return;
    }
    const sim = simulateTrim(catalogue, request.carId, request.trimId, request.conditions, cache);
    scope.postMessage({
      type: 'result',
      id: request.id,
      report: toReport(sim, request.conditions, catalogue),
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
