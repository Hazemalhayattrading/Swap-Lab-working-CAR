import type { ModelConstants, SimCar, SimTransmission } from '../data/sim-data';

/**
 * Drivetrain loss from crank to wheels (BUILD_PROMPT 6.1: by layout and
 * transmission type), as a roller chassis dyno would read it: gearbox (direct
 * or indirect gear, manual, automatic with torque converter, or automated
 * manual), final drive, and the tyre-to-roller transfer. The pull is made in
 * the direct (1:1) gear where the gearbox has one, as dyno operators do;
 * otherwise in the gear nearest 1:1. A proportional model: the research found
 * that real losses are part fixed, part proportional (PEREK, EPA), which the
 * known-build calibration (part 2b) will test.
 */
export interface Drivetrain {
  /** Wheel power / crank power. */
  efficiency: number;
  /** 1-based gear the pull is made in. */
  gear: number;
  ratio: number;
  direct: boolean;
  type: SimTransmission['type'];
  layout: SimCar['layout'];
}

export function drivetrainFor(
  layout: SimCar['layout'],
  transmission: SimTransmission,
  k: ModelConstants,
): Drivetrain {
  let gear = 0;
  transmission.ratios.forEach((r, i) => {
    if (Math.abs(r - 1) < Math.abs((transmission.ratios[gear] ?? 0) - 1)) gear = i;
  });
  const ratio = transmission.ratios[gear] ?? 1;
  const direct = Math.abs(ratio - 1) < 0.005;
  const gearbox =
    transmission.type === 'automatic'
      ? k['drivetrain-automatic']
      : transmission.type === 'automated-manual'
        ? k['drivetrain-automated-manual']
        : direct
          ? k['drivetrain-manual-direct']
          : k['drivetrain-manual-indirect'];
  return {
    efficiency: gearbox * k['drivetrain-final-drive'] * k['drivetrain-tyre-roller'],
    gear: gear + 1,
    ratio,
    direct,
    type: transmission.type,
    layout,
  };
}
