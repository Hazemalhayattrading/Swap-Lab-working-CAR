import type { ModelConstants } from '../data/sim-data';
import type { ReferenceCurve } from './calibrate/reference-curve';

/**
 * The uncertainty band on the dyno chart (BUILD_PROMPT 2.3), as a fraction of
 * torque (and so of power) per rpm. It adds, as independent parts:
 * - the tolerance of the factory figure itself;
 * - the rating standard, when the maker doesn't print it;
 * - the stock curve's shape: nothing at a published point, growing to its
 *   full value `band-shape-distance` rpm away, and wider below a turbo's spool
 *   point, where only the turbo model speaks;
 * - the gap between the rating conditions and yours (intake temperature and
 *   octane), since every correction the model makes is itself approximate;
 * - the calibration's own residual at the published points.
 */
export interface BandInput {
  grid: readonly number[];
  curve: ReferenceCurve;
  boosted: boolean;
  assumedStandard: boolean;
  /** Largest calibration error at a published point, as a fraction. */
  calibrationError: number;
  /** K between the rating's intake temperature and this run's, per grid rpm. */
  intakeDelta: readonly number[];
  /** Octane numbers between the rating fuel and this run's. */
  octaneDelta: number;
}

export function uncertaintyBand(input: BandInput, k: ModelConstants): number[] {
  const { grid, curve } = input;
  const shapeMax = input.boosted ? k['band-shape-boosted'] : k['band-shape-na'];
  const distance = k['band-shape-distance'];
  return grid.map((n, i) => {
    let shape: number;
    if (input.boosted && n < curve.start) {
      shape = k['band-spool'];
    } else if (curve.source === 'published-curve') {
      shape = 0;
    } else {
      const nearest = Math.min(...curve.anchors.map((a) => Math.abs(n - a)));
      shape = shapeMax * Math.min(1, nearest / distance);
    }
    const conditions =
      k['band-per-kelvin'] * Math.abs(input.intakeDelta[i] ?? 0) +
      k['band-per-octane'] * Math.abs(input.octaneDelta);
    const parts = [
      k['band-rating-tolerance'],
      input.assumedStandard ? k['band-standard-unknown'] : 0,
      shape,
      conditions,
      input.calibrationError,
    ];
    return Math.sqrt(parts.reduce((s, x) => s + x * x, 0));
  });
}
