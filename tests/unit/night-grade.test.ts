import { describe, expect, it } from 'vitest';
import { applyNightGrade } from '../../src/scene/night-grade';

const px = (...rgb: number[][]) =>
  new Float32Array(rgb.flatMap(([r, g, b]) => [r ?? 0, g ?? 0, b ?? 0, 1]));

describe('applyNightGrade', () => {
  it('dims bright daylight (clearly blue) pixels', () => {
    const data = px([4, 5, 6.4]);
    applyNightGrade(data);
    expect(data[0]).toBeLessThan(0.2);
    expect(data[2]).toBeLessThan(0.3);
  });

  it('keeps bright neutral pixels (the fluorescent strips)', () => {
    const data = px([20, 20, 20.5]);
    applyNightGrade(data);
    expect(Array.from(data.slice(0, 3))).toEqual([20, 20, 20.5]);
  });

  it('keeps dim pixels even when they are blue (room fill)', () => {
    const data = px([0.1, 0.12, 0.2]);
    applyNightGrade(data);
    expect(data[2]).toBeCloseTo(0.2, 6);
  });

  it('leaves alpha alone and reports the share of light removed', () => {
    const data = px([4, 5, 6.4], [4, 5, 4]);
    const share = applyNightGrade(data);
    expect(data[3]).toBe(1);
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.5);
  });
});
