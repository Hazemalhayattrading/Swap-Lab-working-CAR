import { HITCH_MS, TARGET_FPS, type FpsStats } from '../render/fps-window';
import type { GpuIdentity } from '../render/software-renderer';

/**
 * The frame-rate check shown with `?fps=1`: a test-bench readout for measuring
 * the 60 fps target on the owner's own hardware. While it is open the garage
 * draws every display refresh, so the figures are a measurement rather than
 * "idle". Not a live region: it updates four times a second.
 */

export interface FpsContext {
  backend: string;
  gpu: string | undefined;
  quality: string;
  drawCalls: number;
  triangles: number;
}

/** The GPU as the browser names it: WebGPU's adapter description, or the WebGL renderer string. */
export function gpuLabel(identity: GpuIdentity): string | undefined {
  const w = identity.webgpu;
  const described = w?.description?.trim();
  if (described) return described;
  const named = [w?.vendor, w?.architecture].filter((s) => s && s.trim().length > 0).join(' ');
  if (named) return named;
  return identity.webglRenderer;
}

const STATS = [
  ['fps', 'Mean'],
  ['low', '1 % low'],
  ['worst', 'Worst frame'],
  ['hitches', `Over ${HITCH_MS.toFixed(1)} ms`],
  ['cpu', 'CPU per frame'],
  ['draws', 'Draw calls'],
  ['triangles', 'Triangles'],
] as const;
type StatId = (typeof STATS)[number][0];

export class FpsOverlay {
  private readonly root: HTMLElement;
  private readonly verdict: HTMLElement;
  private readonly setup: HTMLElement;
  private readonly values = new Map<StatId, HTMLElement>();

  constructor(parent: HTMLElement) {
    this.root = document.createElement('aside');
    this.root.className = 'fps-probe';
    this.root.id = 'fps-probe';
    this.root.dataset.state = 'measuring';
    this.root.setAttribute('aria-labelledby', 'fps-probe-title');

    const title = document.createElement('h2');
    title.className = 'fps-probe__title';
    title.id = 'fps-probe-title';
    title.textContent = 'Frame-rate check';

    this.verdict = document.createElement('p');
    this.verdict.className = 'fps-probe__verdict';
    this.verdict.textContent = `${String(TARGET_FPS)} fps target: measuring`;

    const list = document.createElement('dl');
    list.className = 'fps-probe__stats';
    for (const [id, label] of STATS) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.dataset.stat = id;
      dd.textContent = '--';
      row.append(dt, dd);
      list.append(row);
      this.values.set(id, dd);
    }

    this.setup = document.createElement('p');
    this.setup.className = 'fps-probe__setup';

    const note = document.createElement('p');
    note.className = 'fps-probe__note';
    note.textContent = `Draws every frame while ?fps=1 is on; the last 5 s count. Held means a mean within 2 % of ${String(TARGET_FPS)} fps or above, with at most 1 % of frames over ${HITCH_MS.toFixed(1)} ms. The display's refresh rate caps the rate.`;

    this.root.append(title, this.verdict, list, this.setup, note);
    parent.append(this.root);
  }

  update(stats: FpsStats | null, context: FpsContext): void {
    this.setup.textContent = `${context.backend}${context.gpu ? ` on ${context.gpu}` : ''}, ${context.quality} quality.`;
    this.set('draws', String(context.drawCalls));
    this.set('triangles', context.triangles.toLocaleString('en-US'));
    if (!stats) return;
    this.set('fps', `${stats.fps.toFixed(1)} fps`);
    this.set('low', `${stats.lowFps.toFixed(1)} fps`);
    this.set('worst', `${stats.worstMs.toFixed(1)} ms`);
    this.set('hitches', `${(stats.hitchShare * 100).toFixed(1)} % of frames`);
    this.set('cpu', `${stats.cpuMs.toFixed(1)} ms`);
    this.root.dataset.state = stats.holdsTarget ? 'held' : 'missed';
    this.verdict.textContent = `${String(TARGET_FPS)} fps target: ${stats.holdsTarget ? 'held' : 'not held'}`;
  }

  private set(id: StatId, text: string): void {
    const node = this.values.get(id);
    if (node) node.textContent = text;
  }
}
