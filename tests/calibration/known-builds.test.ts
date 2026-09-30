import { describe, expect, it } from 'vitest';
import { MIN_KNOWN_BUILDS_PER_CAR } from '../../src/data/sim-data';
import { KNOWN_BUILD_TOLERANCE, simulateKnownBuild } from '../../src/sim/known-builds';
import { FitCache } from '../../src/sim/simulate';
import { catalogue } from '../support/catalogue';

/**
 * Known-build calibration (BUILD_PROMPT 6.5). Every documented real build in
 * src/data/builds/ runs through the model with its parts, fuel and dyno-day
 * air, is turned into what its own dyno would print (the dyno's reading
 * against a Dynojet, and the sheet's correction standard), and must land
 * within 10 % of the peak wheel power on the sheet. Every launch car needs at
 * least three such builds, unless the owner has approved an exception for it
 * in its builds file. CI fails if any of these rules breaks.
 *
 * A build marked `excluded` (its sheet fails an inclusion rule, with the
 * reason on file) is still run and shown in the drawer, but doesn't count.
 */

const cache = new FitCache();
const hp = (w: number): string => (w / 745.7).toFixed(1);

/** Cars with the owner's exception to the three-build rule (approved 2026-09-30). */
const OWNER_APPROVED_EXCEPTIONS = ['toyota-supra-jza80'];

/**
 * The builds that chose the constants fitted on 2026-09-30, so their scores
 * are in-sample. A build added later is scored out-of-sample first, before any
 * constant is refitted, and keeps that first score (`holdout`); a refit that
 * adds builds to this set changes this list in the same commit.
 */
const FIT_SET_2026_09_30 = [
  'aa-m3-bone-stock',
  'eas-m3-elbow-catback-stock-tune',
  'eas-m3-headers-bspec-tune',
  'motoiq-m3-stock',
  'turblown-fd-efr7670-91',
  'banzai-fd-twins-12p5psi',
  'banzai-fd-twins-14p5psi',
  'zcg-2003-stock',
  'zcg-2003-intake-spacer-catback',
  'zcg-2003-intake-spacer-catback-uprev',
  'zcg-2004-roadster-intake',
  'zcg-2004-roadster-intake-uprev',
  'zcg-2008-nismo-stock',
  'dsport-s15-stock-creep',
  'dsport-s15-12psi-power-fc-turboback',
  'dsport-s15-18psi-fmic',
  'apex-s15-17psi-98-mainline',
  'gotboost-supra-stock-twins',
  'trinidad-supra-stock-twins-1bar',
  'dsport-supra-gt3582r-22psi',
];

describe.each(catalogue.cars)('known builds: $make $model ($chassis)', (car) => {
  const builds = catalogue.knownBuilds.filter((b) => b.carId === car.id && !b.excluded);
  const exception = catalogue.buildCountExceptions.find((e) => e.carId === car.id);
  const needed = exception?.minBuilds ?? MIN_KNOWN_BUILDS_PER_CAR;

  it(`has at least ${String(needed)} documented builds${exception ? ' (owner-approved exception)' : ''}`, () => {
    expect(builds.length).toBeGreaterThanOrEqual(needed);
  });

  if (exception) {
    it('still needs its build-count exception', () => {
      // Once the car has three counted builds, the exception comes out of its builds file.
      expect(builds.length).toBeLessThan(MIN_KNOWN_BUILDS_PER_CAR);
    });
  }

  it.each(builds.map((b) => ({ id: b.id, build: b })))('$id', ({ build }) => {
    const result = simulateKnownBuild(catalogue, build, cache);
    const message = `${build.title}: model ${hp(result.predicted)} vs sheet ${hp(result.measured)} whp`;
    expect(Math.abs(result.error), message).toBeLessThanOrEqual(KNOWN_BUILD_TOLERANCE);
  });
});

describe('build-count exceptions', () => {
  it('only the cars the owner approved have one; every other car needs three', () => {
    expect(MIN_KNOWN_BUILDS_PER_CAR).toBe(3);
    expect(catalogue.buildCountExceptions.map((e) => e.carId).sort()).toEqual(
      OWNER_APPROVED_EXCEPTIONS,
    );
  });
});

describe('out-of-sample scoring', () => {
  it('the fit set is the builds that chose the 2026-09-30 constants, and no others', () => {
    const fit = catalogue.knownBuilds.filter((b) => b.scoring.sample === 'fit').map((b) => b.id);
    expect(fit.sort()).toEqual([...FIT_SET_2026_09_30].sort());
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
