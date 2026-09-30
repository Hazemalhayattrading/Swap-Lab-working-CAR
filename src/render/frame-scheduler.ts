/**
 * Renders on demand: a frame is drawn only when something asks for one (the
 * camera moving, a resize, a quality change, a finished load), and frames keep
 * coming only while the frame callback says the picture is still changing
 * (orbit damping easing the camera to a stop). An idle garage costs no GPU time,
 * which matters on laptop graphics and batteries.
 *
 * Pure apart from the injected `requestFrame`, so it can be tested without a browser.
 */
export interface FrameInfo {
  /** rAF timestamp, ms. */
  time: number;
  /** True when the previous frame was part of the same run of frames. */
  continuing: boolean;
}

export class FrameScheduler {
  private scheduled = false;
  private owed = 0;
  private running = false;

  /**
   * @param frame Draws one frame; returns true if the picture is still changing
   *   (another frame is needed).
   * @param onIdle Called when a run of frames ends.
   * @param requestFrame requestAnimationFrame, injectable for tests.
   */
  constructor(
    private readonly frame: (info: FrameInfo) => boolean,
    private readonly onIdle: () => void = () => undefined,
    private readonly requestFrame: (callback: (time: number) => void) => unknown = (cb) =>
      requestAnimationFrame(cb),
  ) {}

  /** Asks for at least `frames` more frames (1 by default). Cheap to call often. */
  request(frames = 1): void {
    this.owed = Math.max(this.owed, frames);
    this.schedule();
  }

  /** True while a run of frames is in progress. */
  get active(): boolean {
    return this.scheduled || this.running;
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.requestFrame((time) => {
      this.tick(time);
    });
  }

  private tick(time: number): void {
    this.scheduled = false;
    const continuing = this.running;
    this.running = true;
    this.owed = Math.max(0, this.owed - 1);
    const changing = this.frame({ time, continuing });
    if (changing || this.owed > 0) {
      this.schedule();
    } else {
      this.running = false;
      this.onIdle();
    }
  }
}
