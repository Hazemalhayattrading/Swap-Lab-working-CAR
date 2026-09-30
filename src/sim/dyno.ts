import type { ModelConstants } from '../data/sim-data';
import { solvePoint, type Conditions, type EngineModel, type OperatingPoint } from './engine/model';

/** A full-load sweep, idle to redline every 100 rpm (BUILD_PROMPT 6.1). */
export interface DynoRun {
  points: OperatingPoint[];
  peakTorque: { value: number; rpm: number };
  peakPower: { value: number; rpm: number };
}

export function peaks(points: readonly OperatingPoint[]): Omit<DynoRun, 'points'> {
  let t = { value: -Infinity, rpm: 0 };
  let p = { value: -Infinity, rpm: 0 };
  for (const pt of points) {
    if (pt.torque > t.value) t = { value: pt.torque, rpm: pt.rpm };
    if (pt.power > p.value) p = { value: pt.power, rpm: pt.rpm };
  }
  return { peakTorque: t, peakPower: p };
}

export function runDyno(model: EngineModel, conditions: Conditions, k: ModelConstants): DynoRun {
  const points = model.grid.map((n) => solvePoint(model, n, conditions, k));
  return { points, ...peaks(points) };
}
