import { describe, expect, it } from 'vitest';
import { FpsWindow, HITCH_MS, parseFpsRequest } from '../../src/render/fps-window';

/** Feeds `count` frames `ms` apart, each with `cpuMs` of drawing, starting at `from`. */
function feed(w: FpsWindow, from: number, count: number, ms: number, cpuMs = 2): number {
  let t = from;
  for (let i = 0; i < count; i++) {
    w.add(t, cpuMs);
    t += ms;
  }
  return t - ms;
}

describe('frame-rate check (?fps=1)', () => {
  it('turns on with ?fps=1, true or on, and not otherwise', () => {
    expect(parseFpsRequest('?fps=1')).toBe(true);
    expect(parseFpsRequest('?quality=low&fps=on')).toBe(true);
    expect(parseFpsRequest('?fps=TRUE')).toBe(true);
    expect(parseFpsRequest('')).toBe(false);
    expect(parseFpsRequest('?fps=0')).toBe(false);
  });

  it('needs two intervals before it reports', () => {
    const w = new FpsWindow();
    w.add(0, 1);
    w.add(16.7, 1);
    expect(w.stats()).toBeNull();
    w.add(33.4, 1);
    expect(w.stats()?.frames).toBe(2);
  });

  it('reads a steady 60 Hz display as holding the target', () => {
    const w = new FpsWindow();
    feed(w, 0, 200, 1000 / 60, 3);
    const s = w.stats();
    expect(s?.fps).toBeCloseTo(60, 5);
    expect(s?.lowFps).toBeCloseTo(60, 5);
    expect(s?.worstMs).toBeCloseTo(1000 / 60, 5);
    expect(s?.hitchShare).toBe(0);
    expect(s?.cpuMs).toBeCloseTo(3, 5);
    expect(s?.holdsTarget).toBe(true);
  });

  it('counts dropped frames as hitches, and too many of them miss the target', () => {
    const w = new FpsWindow();
    // 60 Hz with one dropped frame (a 33 ms interval) in every 20.
    let t = 0;
    for (let i = 0; i < 200; i++) {
      w.add(t, 2);
      t += i % 20 === 19 ? 2000 / 60 : 1000 / 60;
    }
    const s = w.stats();
    expect(s?.worstMs).toBeCloseTo(2000 / 60, 5);
    expect(s?.worstMs).toBeGreaterThan(HITCH_MS);
    expect(s?.hitchShare).toBeCloseTo(0.05, 2);
    expect(s?.lowFps).toBeCloseTo(30, 5);
    expect(s?.holdsTarget).toBe(false);
  });

  it('reads 45 fps as missing the target', () => {
    const w = new FpsWindow();
    feed(w, 0, 100, 1000 / 45);
    expect(w.stats()?.fps).toBeCloseTo(45, 5);
    expect(w.stats()?.holdsTarget).toBe(false);
  });

  it('keeps only the last five seconds, and starts over after a reset', () => {
    const w = new FpsWindow(5000);
    const end = feed(w, 0, 300, 1000 / 30);
    feed(w, end + 1000 / 60, 600, 1000 / 60);
    expect(w.stats()?.fps).toBeCloseTo(60, 1);
    // The oldest interval kept may start just before the five seconds.
    expect(w.stats()?.spanMs).toBeGreaterThan(4900);
    expect(w.stats()?.spanMs).toBeLessThanOrEqual(5000 + 1000 / 60 + 1e-6);
    w.reset();
    expect(w.stats()).toBeNull();
    // The pause while the tab was hidden isn't counted as a frame.
    w.add(100_000, 2);
    w.add(100_000 + 1000 / 60, 2);
    w.add(100_000 + 2000 / 60, 2);
    expect(w.stats()?.worstMs).toBeCloseTo(1000 / 60, 5);
  });
});
