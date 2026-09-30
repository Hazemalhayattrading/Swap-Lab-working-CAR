/**
 * Frame-rate measurement for `?fps=1` (the owner, 2026-09-30), so the 60 fps
 * target (CLAUDE.md rule 8) can be checked on real hardware: the last few
 * seconds of frame intervals, as a mean, a 1 % low and a worst frame. Pure, so
 * it can be tested without a browser.
 */

/** `?fps=1` (also `true` or `on`) turns the measurement on. */
export function parseFpsRequest(search: string): boolean {
  const value = new URLSearchParams(search).get('fps')?.toLowerCase();
  return value === '1' || value === 'true' || value === 'on';
}

export const TARGET_FPS = 60;
/** ms: one frame at the target, plus 10 % for display timing jitter. A longer one is a hitch. */
export const HITCH_MS = (1000 / TARGET_FPS) * 1.1;
/** The mean may sit this far under the target and still count as holding it (vsync jitter). */
const TARGET_SLACK = 0.02;
/** The share of hitches a run may have and still count as holding the target. */
const HITCH_ALLOWANCE = 0.01;

export interface FpsStats {
  /** Frame intervals in the window. */
  frames: number;
  /** ms the window covers. */
  spanMs: number;
  /** Mean frame rate over the window. */
  fps: number;
  /** ms, mean frame interval. */
  frameMs: number;
  /** Frame rate of the 99th-percentile interval: the "1 % low". */
  lowFps: number;
  /** ms, the longest interval in the window. */
  worstMs: number;
  /** Share of intervals longer than HITCH_MS. */
  hitchShare: number;
  /** ms, mean CPU time the page spent drawing each frame (the GPU finishes the work after). */
  cpuMs: number;
  /** The mean is within 2 % of the target or above it, and at most 1 % of frames are hitches. */
  holdsTarget: boolean;
}

export class FpsWindow {
  private intervals: { at: number; ms: number; cpuMs: number }[] = [];
  private last: number | undefined;

  constructor(private readonly windowMs = 5000) {}

  /** Starts over: after a pause (a hidden tab), the gap isn't a frame. */
  reset(): void {
    this.intervals = [];
    this.last = undefined;
  }

  /** Feed each frame's animation timestamp (ms) and the CPU ms its drawing took. */
  add(now: number, cpuMs: number): void {
    if (this.last !== undefined) this.intervals.push({ at: now, ms: now - this.last, cpuMs });
    this.last = now;
    const from = now - this.windowMs;
    let drop = 0;
    while (drop < this.intervals.length && (this.intervals[drop]?.at ?? now) < from) drop++;
    if (drop > 0) this.intervals.splice(0, drop);
  }

  /** Stats over the window, once it holds at least two intervals. */
  stats(): FpsStats | null {
    const n = this.intervals.length;
    if (n < 2) return null;
    const ms = this.intervals.map((i) => i.ms);
    const span = ms.reduce((s, x) => s + x, 0);
    const sorted = [...ms].sort((a, b) => a - b);
    const p99 = sorted[Math.max(0, Math.ceil(0.99 * n) - 1)] ?? 0;
    const frameMs = span / n;
    const fps = frameMs > 0 ? 1000 / frameMs : 0;
    const hitchShare = ms.filter((x) => x > HITCH_MS).length / n;
    return {
      frames: n,
      spanMs: span,
      fps,
      frameMs,
      lowFps: p99 > 0 ? 1000 / p99 : 0,
      worstMs: sorted[n - 1] ?? 0,
      hitchShare,
      cpuMs: this.intervals.reduce((s, i) => s + i.cpuMs, 0) / n,
      holdsTarget: fps >= TARGET_FPS * (1 - TARGET_SLACK) && hitchShare <= HITCH_ALLOWANCE,
    };
  }
}
