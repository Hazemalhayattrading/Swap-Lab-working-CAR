import { niceStep } from './format';

/**
 * Chart axes that fit the data (dyno sheet). An axis starts at zero, as dyno
 * sheets do, and its top is a round number of round steps just above the
 * data: the step is 1, 2, 2.5 or 5 x 10^n and the number of intervals is
 * picked, from a small range, to waste the least height. Torque (left) and
 * power (right) share the chart's grid lines, so they share one interval count.
 * Pure, so it can be tested.
 */
export interface Axis {
  top: number;
  step: number;
  intervals: number;
  /** Decimals the tick labels need to show the step exactly. */
  digits: number;
}

/** Space left above the highest value, so a peak never sits on the top line. */
export const HEADROOM = 1.04;

export function stepDigits(step: number): number {
  let digits = 0;
  while (digits < 6 && Math.abs(step * 10 ** digits - Math.round(step * 10 ** digits)) > 1e-9) {
    digits++;
  }
  return digits;
}

function axisFor(max: number, intervals: number): Axis {
  const target = Math.max(max, 1e-9) * HEADROOM;
  const step = niceStep(target / intervals);
  return { top: step * intervals, step, intervals, digits: stepDigits(step) };
}

/** One axis: the interval count in `counts` whose round top sits closest above the data. */
export function fitAxis(max: number, counts: readonly number[] = [4, 5, 6]): Axis {
  let best: Axis | undefined;
  for (const n of counts) {
    const axis = axisFor(max, n);
    if (!best || axis.top < best.top - 1e-9) best = axis;
  }
  if (!best) throw new Error('fitAxis needs at least one interval count.');
  return best;
}

/**
 * Two axes on shared grid lines (left and right of one chart): the interval
 * count that wastes the least height across both, as a share of each axis.
 */
export function fitSharedAxes(
  maxLeft: number,
  maxRight: number,
  counts: readonly number[] = [4, 5, 6],
): { left: Axis; right: Axis } {
  let best: { left: Axis; right: Axis; waste: number } | undefined;
  for (const n of counts) {
    const left = axisFor(maxLeft, n);
    const right = axisFor(maxRight, n);
    const waste =
      left.top / (Math.max(maxLeft, 1e-9) * HEADROOM) +
      right.top / (Math.max(maxRight, 1e-9) * HEADROOM);
    if (!best || waste < best.waste - 1e-9) best = { left, right, waste };
  }
  if (!best) throw new Error('fitSharedAxes needs at least one interval count.');
  return { left: best.left, right: best.right };
}
