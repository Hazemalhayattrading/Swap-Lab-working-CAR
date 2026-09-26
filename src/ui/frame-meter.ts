/**
 * Rolling frame-time meter. Feed it the animation-loop timestamp every frame;
 * it returns averaged stats once per `intervalMs` and `null` otherwise.
 */
export class FrameMeter {
  private last: number | undefined;
  private windowStart: number | undefined;
  private frameCount = 0;
  private frameTimeSum = 0;

  constructor(private readonly intervalMs = 500) {}

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
