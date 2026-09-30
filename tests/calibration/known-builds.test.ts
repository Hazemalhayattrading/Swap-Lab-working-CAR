import { describe, expect, it } from 'vitest';
import { KNOWN_BUILD_TOLERANCE, simulateKnownBuild } from '../../src/sim/known-builds';
import { FitCache } from '../../src/sim/simulate';
import { catalogue } from '../support/catalogue';

/**
 * Known-build calibration (BUILD_PROMPT 6.5). Every documented real build in
 * src/data/builds/ runs through the model with its parts, fuel and dyno-day
 * air, is turned into what its own dyno would print (the dyno's reading
 * against a Dynojet, and the sheet's correction standard), and must land
 * within 10 % of the peak wheel power on the sheet. Every launch car needs at
 * least three such builds. CI fails if either rule breaks.
 *
 * A build marked `excluded` (its sheet fails an inclusion rule, with the
 * reason on file) is still run and shown in the drawer, but doesn't count.
 */

const cache = new FitCache();
const MIN_BUILDS_PER_CAR = 3;
const hp = (w: number): string => (w / 745.7).toFixed(1);

describe.each(catalogue.cars)('known builds: $make $model ($chassis)', (car) => {
  const builds = catalogue.knownBuilds.filter((b) => b.carId === car.id && !b.excluded);

  it(`has at least ${String(MIN_BUILDS_PER_CAR)} documented builds`, () => {
    expect(builds.length).toBeGreaterThanOrEqual(MIN_BUILDS_PER_CAR);
  });

  it.each(builds.map((b) => ({ id: b.id, build: b })))('$id', ({ build }) => {
    const result = simulateKnownBuild(catalogue, build, cache);
    const message = `${build.title}: model ${hp(result.predicted)} vs sheet ${hp(result.measured)} whp`;
    expect(Math.abs(result.error), message).toBeLessThanOrEqual(KNOWN_BUILD_TOLERANCE);
  });
});

describe('excluded known builds', () => {
  it.each(catalogue.knownBuilds.filter((b) => b.excluded).map((b) => ({ id: b.id, build: b })))(
    '$id still runs, and says why it is out',
    ({ build }) => {
      expect(build.excluded?.reason.length).toBeGreaterThan(20);
      const result = simulateKnownBuild(catalogue, build, cache);
      expect(Number.isFinite(result.predicted)).toBe(true);
    },
  );
});
