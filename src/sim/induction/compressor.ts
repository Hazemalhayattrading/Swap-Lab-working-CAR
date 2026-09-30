import { clamp } from '../math';

/**
 * A simplified centrifugal compressor map (BUILD_PROMPT 6.1): flow and
 * pressure-ratio limits and elliptical efficiency islands.
 *
 * Flow is corrected to 298.15 K and 101.325 kPa inlet, the way maps are
 * drawn. On the map, `y` runs from pressure ratio 1 (0) to the top of the map
 * (1); the surge line runs from zero flow at PR 1 to 42 % of the choke flow
 * at the top, and the choke line from 65 % to 100 %. `x` is the position
 * between them at that pressure ratio: 0 on the surge line, 1 at choke.
 * The efficiency peak sits at x = 0.55, y = 0.6, and falls away as ellipses,
 * faster near choke.
 */
export interface CompressorMap {
  /** Corrected mass flow at choke at the top of the map, kg/s. */
  chokeFlow: number;
  /** Highest pressure ratio on the map (the speed limit). */
  maxPressureRatio: number;
  peakEfficiency: number;
}

export const MAP_REFERENCE_TEMPERATURE = 298.15;
export const MAP_REFERENCE_PRESSURE = 101_325;

const SURGE_AT_TOP = 0.42;
const CHOKE_AT_PR1 = 0.65;
const CHOKE_RISE = 0.35;

export function correctedFlow(massFlow: number, inletTemperature: number, inletPressure: number) {
  return (
    (massFlow * Math.sqrt(inletTemperature / MAP_REFERENCE_TEMPERATURE)) /
    (inletPressure / MAP_REFERENCE_PRESSURE)
  );
}

export interface MapPoint {
  /** 0 = surge line, 1 = choke line. */
  x: number;
  /** 0 = pressure ratio 1, 1 = top of the map. */
  y: number;
  surgeFlow: number;
  chokeFlow: number;
}

export function mapPoint(map: CompressorMap, corrected: number, pressureRatio: number): MapPoint {
  const y = (pressureRatio - 1) / (map.maxPressureRatio - 1);
  const yc = Math.max(0, y);
  const surgeFlow = map.chokeFlow * SURGE_AT_TOP * yc;
  const chokeFlow = map.chokeFlow * (CHOKE_AT_PR1 + CHOKE_RISE * Math.min(yc, 1.2));
  return { x: (corrected - surgeFlow) / (chokeFlow - surgeFlow), y, surgeFlow, chokeFlow };
}

/** Isentropic efficiency at a map point (total-to-total). */
export function compressorEfficiency(map: CompressorMap, point: MapPoint): number {
  const x = clamp(point.x, -0.2, 1.2);
  const y = clamp(point.y, 0, 1.3);
  const chokeFall = Math.max(0, x - 0.85);
  const eta =
    map.peakEfficiency *
    (1 - 0.45 * (x - 0.55) ** 2 - 0.35 * (y - 0.6) ** 2 - 2.5 * chokeFall * chokeFall);
  return clamp(eta, 0.35, map.peakEfficiency);
}

/** Outlet temperature for a pressure ratio and isentropic efficiency, K. */
export function compressorOutletTemperature(
  inletTemperature: number,
  pressureRatio: number,
  efficiency: number,
  gamma: number,
): number {
  const ideal = Math.pow(Math.max(pressureRatio, 1), (gamma - 1) / gamma) - 1;
  return inletTemperature * (1 + ideal / efficiency);
}

/** Surge margin kept at the stock operating line's lowest-flow point when sizing. */
const SIZING_SURGE_POSITION = 0.08;

/**
 * Sizes a factory compressor whose real map isn't published, from the stock
 * operating line it has to run: the smallest choke flow that keeps every
 * stock point at or left of `chokePosition`, without pushing the low-rpm,
 * full-boost points into surge. If the map is too narrow for both, it is
 * widened (a higher top pressure ratio moves the surge line left), then the
 * choke margin is relaxed. `compromise` is true if nothing fits cleanly.
 */
export function sizeCompressor(
  points: readonly { corrected: number; pressureRatio: number }[],
  opts: { chokePosition: number; pressureRatioFraction: number; peakEfficiency: number },
): CompressorMap & { compromise: boolean } {
  const topPr = Math.max(...points.map((p) => p.pressureRatio));
  let fallback: (CompressorMap & { compromise: boolean }) | undefined;
  for (const fraction of [opts.pressureRatioFraction, 0.55, 0.45, 0.35]) {
    const maxPressureRatio = 1 + Math.max(topPr - 1, 0.05) / fraction;
    for (const xs of [opts.chokePosition, 0.95, 1]) {
      let low = 0;
      let high = Infinity;
      for (const p of points) {
        const y = Math.max(0, (p.pressureRatio - 1) / (maxPressureRatio - 1));
        const width = CHOKE_AT_PR1 + CHOKE_RISE * y - SURGE_AT_TOP * y;
        low = Math.max(low, p.corrected / (xs * width + SURGE_AT_TOP * y));
        high = Math.min(high, p.corrected / (SIZING_SURGE_POSITION * width + SURGE_AT_TOP * y));
      }
      if (low <= high) {
        return {
          chokeFlow: low,
          maxPressureRatio,
          peakEfficiency: opts.peakEfficiency,
          compromise: false,
        };
      }
      fallback = {
        chokeFlow: Math.sqrt(low * high),
        maxPressureRatio,
        peakEfficiency: opts.peakEfficiency,
        compromise: true,
      };
    }
  }
  if (!fallback) throw new Error('sizeCompressor needs at least one point.');
  return fallback;
}
