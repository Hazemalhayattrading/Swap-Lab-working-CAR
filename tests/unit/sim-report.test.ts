import { describe, expect, it } from 'vitest';
import { gearboxLabel, hasNumbers, toReport } from '../../src/sim/report';
import { FitCache, defaultConditions, simulateTrim } from '../../src/sim/simulate';
import { catalogue } from '../support/catalogue';

/**
 * The report the worker posts to the page. CLAUDE.md rule 3: a trim whose
 * stock check fails must not show simulated numbers, so its report carries
 * none; the page can't show what it never receives.
 */

const cache = new FitCache();
const DEFAULT_CONDITIONS = defaultConditions(catalogue);
const s15 = () =>
  simulateTrim(catalogue, 'nissan-silvia-s15', 'jdm-spec-r-6mt', DEFAULT_CONDITIONS, cache);

describe('dyno report', () => {
  it('carries the curve, peaks and limits when the stock check passes', () => {
    const sim = s15();
    expect(sim.calibration.pass).toBe(true);
    const report = toReport(sim, DEFAULT_CONDITIONS, catalogue);
    expect(hasNumbers(report)).toBe(true);
    if (!hasNumbers(report)) return;
    expect(report.channels.rpm.length).toBe(report.channels.torque.length);
    expect(report.channels.band.every((b) => b > 0 && b < 0.3)).toBe(true);
    expect(report.peaks.power.value).toBeGreaterThan(0);
    expect(report.limits.map((l) => l.id)).toContain('injector-duty');
  });

  it('leaves every simulated number out when the stock check fails', () => {
    const sim = s15();
    const failed = {
      ...sim,
      calibration: { ...sim.calibration, pass: false, failures: ['Peak power is 8.0 % off.'] },
    };
    const report = toReport(failed, DEFAULT_CONDITIONS, catalogue);
    expect(hasNumbers(report)).toBe(false);
    expect(report.channels).toBeUndefined();
    expect(report.peaks).toBeUndefined();
    expect(report.limits).toBeUndefined();
    expect(report.heatSoak).toBeUndefined();
    const posted = JSON.stringify(report);
    expect(posted).not.toContain('"channels":');
    expect(posted).not.toContain('"peaks":');
    // The sheet still says why: the factory figures and the failure reasons.
    expect(report.calibration.failures).toEqual(['Peak power is 8.0 % off.']);
    expect(report.rating.printed.power).toBe('250 PS');
  });

  it('names the rating conditions and the user conditions', () => {
    const report = toReport(s15(), DEFAULT_CONDITIONS, catalogue);
    expect(report.rating.standard).toBe('JIS-net');
    expect(report.rating.assumed).toBe(false);
    expect(report.rating.temperatureK).toBeCloseTo(298.15, 2);
    expect(report.conditions).toEqual(DEFAULT_CONDITIONS);
    expect(report.title.gearbox).toBe('6-speed manual');
  });

  it('defaults to Riyadh at 45 °C on PG95, and says where and on what', () => {
    expect(DEFAULT_CONDITIONS).toMatchObject({
      temperatureC: 45,
      location: 'riyadh',
      fuelId: 'saudi-95',
    });
    const report = toReport(s15(), DEFAULT_CONDITIONS, catalogue);
    expect(report.environment.locationName).toBe('Riyadh');
    expect(report.environment.pressurePa / 1000).toBeCloseTo(94.2, 1);
    expect(report.environment.fuel.name).toBe('PG95');
    expect(report.environment.fuel.tuned).toBe(false);
    expect(report.environment.notes.some((n) => n.includes('same absolute pressure'))).toBe(true);
  });

  it('carries the heat-soak session with its limits and verdict', () => {
    const report = toReport(s15(), DEFAULT_CONDITIONS, catalogue);
    if (!hasNumbers(report)) throw new Error('S15 should pass its stock check');
    const soak = report.heatSoak;
    expect(soak.duration).toBe(180);
    expect(soak.samples[0]?.time).toBe(0);
    expect(soak.samples[soak.samples.length - 1]?.time).toBe(180);
    expect(soak.pass).toBe(soak.failedAt === undefined);
  });

  it('calls a heat soak on generic cooling sizing an estimate, not a pass or fail', () => {
    // The owner, 2026-09-30: no car has its own radiator figures on file yet.
    for (const [car, trim] of [
      ['nissan-silvia-s15', 'jdm-spec-r-6mt'],
      ['toyota-supra-jza80', 'eudm-turbo-6mt'],
    ] as const) {
      const sim = simulateTrim(catalogue, car, trim, DEFAULT_CONDITIONS, cache);
      const report = toReport(sim, DEFAULT_CONDITIONS, catalogue);
      if (!hasNumbers(report)) throw new Error(`${car} should pass its stock check`);
      expect(report.heatSoak.basis).toBe('generic-sizing');
      const cooling = report.limits.find((l) => l.id === 'cooling');
      expect(cooling?.status).toBe('estimated');
      expect(cooling?.detail).toContain('generic sizing');
    }
  });

  it('carries the owner’s build-count exception for the Supra only', () => {
    const supra = toReport(
      simulateTrim(catalogue, 'toyota-supra-jza80', 'eudm-turbo-6mt', DEFAULT_CONDITIONS, cache),
      DEFAULT_CONDITIONS,
      catalogue,
    );
    expect(supra.knownBuilds).toMatchObject({ counted: 2, required: 2 });
    expect(supra.knownBuilds.exception?.badge).toBe(
      'validated on stock turbos only; big-turbo builds unverified',
    );
    const s15Report = toReport(s15(), DEFAULT_CONDITIONS, catalogue);
    expect(s15Report.knownBuilds.required).toBe(3);
    expect(s15Report.knownBuilds.counted).toBeGreaterThanOrEqual(3);
    expect(s15Report.knownBuilds.exception).toBeUndefined();
  });

  it('says which parts of a turbo curve are the model’s own', () => {
    const report = toReport(s15(), DEFAULT_CONDITIONS, catalogue);
    expect(report.estimates.some((e) => e.includes('boost curve’s shape'))).toBe(true);
  });

  it('labels gearboxes by gear count and type', () => {
    expect(gearboxLabel({ id: 'x', name: 'x', type: 'automatic', ratios: [3, 2, 1, 0.7] })).toBe(
      '4-speed automatic',
    );
    expect(
      gearboxLabel({
        id: 'x',
        name: 'x',
        type: 'automated-manual',
        ratios: [4, 3, 2, 1.4, 1, 0.8],
      }),
    ).toBe('6-speed automated manual');
  });

  it('stays small enough to post on every change', () => {
    const posted = JSON.stringify(toReport(s15(), DEFAULT_CONDITIONS, catalogue));
    expect(posted.length).toBeLessThan(60_000);
  });
});
