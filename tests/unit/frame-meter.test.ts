import { describe, expect, it } from 'vitest';
import { FrameMeter } from '../../src/ui/frame-meter';

describe('FrameMeter', () => {
  it('reports the average frame time once per interval', () => {
    const meter = new FrameMeter(500);
    const reports = [];
    for (let t = 0; t <= 1000; t += 1000 / 60) {
      const r = meter.sample(t);
      if (r) reports.push(r);
    }
    expect(reports.length).toBeGreaterThanOrEqual(1);
    expect(reports[0]?.fps).toBeCloseTo(60, 0);
    expect(reports[0]?.frameMs).toBeCloseTo(16.67, 1);
  });

  it('returns nothing on the first sample', () => {
    expect(new FrameMeter().sample(123)).toBeNull();
  });
});
