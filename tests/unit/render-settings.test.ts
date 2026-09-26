import { describe, expect, it } from 'vitest';
import { backendLabel, parseBackendRequest } from '../../src/render/backend';
import { DEFAULT_QUALITY, QUALITY, pixelRatioFor, resolveQuality } from '../../src/render/quality';

describe('parseBackendRequest', () => {
  it('defaults to auto (WebGPU with automatic WebGL 2 fallback)', () => {
    expect(parseBackendRequest('')).toBe('auto');
    expect(parseBackendRequest('?renderer=webgpu')).toBe('auto');
    expect(parseBackendRequest('?renderer=nonsense')).toBe('auto');
  });

  it('forces WebGL 2 on request', () => {
    expect(parseBackendRequest('?renderer=webgl')).toBe('webgl');
    expect(parseBackendRequest('?renderer=WebGL2&quality=low')).toBe('webgl');
  });

  it('labels backends for the readout', () => {
    expect(backendLabel('webgpu')).toBe('WebGPU');
    expect(backendLabel('webgl2')).toBe('WebGL 2');
  });
});

describe('resolveQuality', () => {
  it('prefers the URL, then the stored choice, then the default', () => {
    expect(resolveQuality('?quality=ultra', 'low')).toBe('ultra');
    expect(resolveQuality('', 'low')).toBe('low');
    expect(resolveQuality('', null)).toBe(DEFAULT_QUALITY);
  });

  it('ignores values that are not quality levels', () => {
    expect(resolveQuality('?quality=max', 'potato')).toBe(DEFAULT_QUALITY);
  });
});

describe('pixelRatioFor', () => {
  it('caps the device pixel ratio per level', () => {
    expect(pixelRatioFor('low', 3)).toBe(1);
    expect(pixelRatioFor('high', 3)).toBe(1.5);
    expect(pixelRatioFor('ultra', 3)).toBe(2);
    expect(pixelRatioFor('ultra', 1.25)).toBe(1.25);
  });

  it('never goes below 1', () => {
    expect(pixelRatioFor('high', 0.5)).toBe(1);
  });

  it('keeps Low cheaper than High and High no more than Ultra', () => {
    expect(QUALITY.low.shadowMapSize).toBeLessThan(QUALITY.high.shadowMapSize);
    expect(QUALITY.high.shadowMapSize).toBeLessThanOrEqual(QUALITY.ultra.shadowMapSize);
    expect(QUALITY.low.bloom).toBe(false);
  });
});
