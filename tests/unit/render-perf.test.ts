import { describe, expect, it } from 'vitest';
import { FrameScheduler } from '../../src/render/frame-scheduler';
import { accelerationAdvice, detectSoftwareRenderer } from '../../src/render/software-renderer';
import {
  RGB9E5_MAX,
  decodeEnvironment,
  encodeEnvironment,
  isGzip,
  packRgb9e5,
  unpackRgb9e5,
} from '../../src/scene/pmrem-file';
import { fitAxis, fitSharedAxes, stepDigits } from '../../src/ui/dyno/axes';

describe('baked environment file', () => {
  it('packs RGB9E5 within its precision and keeps zero, black and the clamp', () => {
    for (const rgb of [
      [1, 1, 1],
      [0.25, 0.5, 0.125],
      [3.2, 0.01, 12.5],
      [1e-4, 2e-4, 0],
      [800, 12, 0.5],
    ] as const) {
      const [r, g, b] = rgb;
      const out = unpackRgb9e5(packRgb9e5(r, g, b));
      const max = Math.max(...rgb);
      rgb.forEach((v, i) => {
        // Shared exponent: each channel is exact to 1/512 of the largest one.
        expect(Math.abs((out[i] ?? 0) - v)).toBeLessThanOrEqual(max / 511);
      });
    }
    expect(packRgb9e5(0, 0, 0)).toBe(0);
    expect(unpackRgb9e5(packRgb9e5(-1, Number.NaN, 0))).toEqual([0, 0, 0]);
    expect(unpackRgb9e5(packRgb9e5(1e9, 0, 0))[0]).toBeCloseTo(RGB9E5_MAX, 0);
  });

  it('round-trips the header and texels, and rejects damaged files', async () => {
    const texels = Uint32Array.from({ length: 12 }, (_, i) => packRgb9e5(i, i / 2, 1));
    const bytes = encodeEnvironment({ width: 3, height: 4, texels });
    const decoded = decodeEnvironment(bytes.slice().buffer);
    expect(decoded.width).toBe(3);
    expect(decoded.height).toBe(4);
    expect([...decoded.texels]).toEqual([...texels]);
    expect(() => decodeEnvironment(bytes.slice(0, bytes.length - 4).buffer)).toThrow(/size/);
    const wrongMagic = bytes.slice();
    wrongMagic[0] = 0;
    expect(() => decodeEnvironment(wrongMagic.buffer)).toThrow(/Not a Swap Lab/);
    const gzipped = new Blob([bytes.slice().buffer])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    expect(isGzip(new Uint8Array(await new Response(gzipped).arrayBuffer()))).toBe(true);
    expect(isGzip(bytes)).toBe(false);
  });
});

describe('on-demand rendering', () => {
  function harness(changingFor = 0) {
    const queue: ((t: number) => void)[] = [];
    let frames = 0;
    let idles = 0;
    const continuing: boolean[] = [];
    const scheduler = new FrameScheduler(
      (info) => {
        frames++;
        continuing.push(info.continuing);
        return frames <= changingFor;
      },
      () => {
        idles++;
      },
      (cb) => queue.push(cb),
    );
    const run = () => {
      let t = 0;
      while (queue.length > 0) queue.shift()?.((t += 16));
    };
    return { scheduler, run, stats: () => ({ frames, idles, continuing }) };
  }

  it('draws only what is asked for, then goes idle', () => {
    const h = harness();
    h.run();
    expect(h.stats().frames).toBe(0);
    h.scheduler.request();
    h.scheduler.request(); // coalesced into the same frame
    h.run();
    expect(h.stats()).toMatchObject({ frames: 1, idles: 1 });
    expect(h.scheduler.active).toBe(false);
    h.scheduler.request(2);
    h.run();
    expect(h.stats().frames).toBe(3);
    expect(h.stats().continuing).toEqual([false, false, true]);
  });

  it('keeps drawing while the picture is still changing (orbit damping)', () => {
    const h = harness(5);
    h.scheduler.request();
    h.run();
    expect(h.stats().frames).toBe(6);
    expect(h.stats().idles).toBe(1);
  });
});

describe('software renderer detection', () => {
  it('names SwiftShader, the Basic Render Driver and llvmpipe from WebGPU or WebGL strings', () => {
    expect(
      detectSoftwareRenderer({ webgpu: { vendor: 'google', architecture: 'swiftshader' } })?.kind,
    ).toBe('swiftshader');
    expect(
      detectSoftwareRenderer({
        webglRenderer:
          'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
      })?.kind,
    ).toBe('swiftshader');
    expect(
      detectSoftwareRenderer({
        webglRenderer:
          'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
      })?.kind,
    ).toBe('basic-render-driver');
    expect(
      detectSoftwareRenderer({ webglRenderer: 'llvmpipe (LLVM 15.0.7, 256 bits)' })?.kind,
    ).toBe('llvmpipe');
    expect(detectSoftwareRenderer({ webgpu: { isFallbackAdapter: true } })?.kind).toBe('fallback');
  });

  it('leaves real GPUs alone, including Intel Arc', () => {
    for (const id of [
      {
        webgpu: {
          vendor: 'intel',
          architecture: 'xe-lpg',
          description: 'Intel(R) Arc(TM) Graphics',
        },
      },
      { webglRenderer: 'ANGLE (Intel, Intel(R) Arc(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { webgpu: { vendor: 'apple', architecture: 'metal-3', isFallbackAdapter: false } },
      {},
    ]) {
      expect(detectSoftwareRenderer(id)).toBeUndefined();
    }
  });

  it('gives driver advice for the Basic Render Driver and browser steps for all', () => {
    const brd = accelerationAdvice({ kind: 'basic-render-driver', name: 'x' });
    expect(brd.steps[0]).toMatch(/driver/);
    const ss = accelerationAdvice({ kind: 'swiftshader', name: 'SwiftShader' });
    expect(ss.lead).toContain('SwiftShader');
    expect(ss.steps.some((s) => s.includes('Use graphics acceleration when available'))).toBe(true);
  });
});

describe('dyno chart axes', () => {
  it('fits both axes close above the data on shared grid lines', () => {
    // The S15 Spec-R at 45 °C: 256 N·m (274 with its band) and 229 hp (245 with its band).
    const { left, right } = fitSharedAxes(274, 245);
    expect(left.intervals).toBe(right.intervals);
    expect(left.top).toBeGreaterThanOrEqual(274 * 1.04);
    expect(right.top).toBeGreaterThanOrEqual(245 * 1.04);
    // The old fixed five intervals put both tops at 500; now neither wastes a third of the chart.
    expect(left.top).toBeLessThanOrEqual(274 * 1.3);
    expect(right.top).toBeLessThanOrEqual(245 * 1.3);
  });

  it('fits big and small numbers the same way, in any unit', () => {
    for (const max of [0.62, 9.1, 47, 193, 612, 1480]) {
      const axis = fitAxis(max);
      expect(axis.top).toBeGreaterThanOrEqual(max * 1.04);
      expect(axis.top).toBeLessThanOrEqual(max * 1.6);
      expect(axis.top / axis.step).toBeCloseTo(axis.intervals, 9);
    }
    expect(fitAxis(0.62, [2, 3]).top).toBeCloseTo(0.75, 9);
    expect(stepDigits(0.25)).toBe(2);
    expect(stepDigits(50)).toBe(0);
    expect(stepDigits(2.5)).toBe(1);
  });
});
