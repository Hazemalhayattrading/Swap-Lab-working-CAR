/**
 * Rolling frame-time meter. Feed it the animation-loop timestamp every frame;
 * it returns averaged stats once per `intervalMs` and `null` otherwise. The
 * garage renders on demand, so each run of frames starts with `reset()` (the
 * gap before it isn't a frame) and ends with `flush()`.
 */
export class FrameMeter {
  private last: number | undefined;
  private windowStart: number | undefined;
  private frameCount = 0;
  private frameTimeSum = 0;

  constructor(private readonly intervalMs = 500) {}

  reset(): void {
    this.last = undefined;
    this.windowStart = undefined;
    this.frameCount = 0;
    this.frameTimeSum = 0;
  }

  /** Stats for the frames since the last report, if there were any. */
  flush(): { frameMs: number; fps: number } | null {
    if (this.frameCount === 0) return null;
    const frameMs = this.frameTimeSum / this.frameCount;
    this.frameCount = 0;
    this.frameTimeSum = 0;
    this.windowStart = this.last;
    return { frameMs, fps: frameMs > 0 ? 1000 / frameMs : 0 };
  }

  sample(nowMs: number): { frameMs: number; fps: number } | null {
    if (this.last === undefined || this.windowStart === undefined) {
      this.last = nowMs;
      this.windowStart = nowMs;
      return null;
    }
    this.frameTimeSum += nowMs - this.last;
    this.frameCount++;
    this.last = nowMs;
    if (nowMs - this.windowStart < this.intervalMs || this.frameCount === 0) return null;
    const frameMs = this.frameTimeSum / this.frameCount;
    this.windowStart = nowMs;
    this.frameCount = 0;
    this.frameTimeSum = 0;
    return { frameMs, fps: frameMs > 0 ? 1000 / frameMs : 0 };
  }
}
