import { backendLabel, type BackendName } from '../render/backend';
import { isQualityLevel, type QualityLevel } from '../render/quality';

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

export type SceneState = 'loading' | 'ready' | 'failed';

/**
 * Puts the page into its fault state: the message is shown, the empty-bay note
 * goes, the readouts stop claiming a live renderer and the quality keys lock.
 * Works without a Hud instance, so start-up errors can use it too.
 */
export function showFault(title: string, body: string): void {
  document.documentElement.dataset.sceneState = 'failed';
  byId('fault-title').textContent = title;
  byId('fault-body').textContent = body;
  byId('fault').hidden = false;
  byId('bay-note').hidden = true;
  byId('readout-backend').textContent = 'Stopped';
  byId('readout-frame').textContent = '--.-';
  byId('readout-fps').textContent = '--';
  (byId('quality') as HTMLFieldSetElement).disabled = true;
  const canvas = byId('viewport');
  canvas.setAttribute('aria-label', 'The 3D workshop view could not start.');
  canvas.removeAttribute('tabindex');
}

export function showStartupFault(): void {
  showFault(
    'The garage could not start',
    'Something went wrong while setting up the 3D view. Reload the page. If it happens again, try another browser.',
  );
}

/** The DOM overlay: shop tag, telemetry strip, empty-bay note and fault panel. */
export class Hud {
  private readonly backendEl = byId('readout-backend');
  private readonly frameEl = byId('readout-frame');
  private readonly fpsEl = byId('readout-fps');
  private readonly telemetry = byId('telemetry');
  private readonly toggle = byId('telemetry-toggle') as HTMLButtonElement;
  private readonly qualityInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('#quality input[name="quality"]'),
  );

  constructor(initialQuality: QualityLevel, onQuality: (level: QualityLevel) => void) {
    this.setQuality(initialQuality);
    for (const input of this.qualityInputs) {
      input.addEventListener('change', () => {
        if (input.checked && isQualityLevel(input.value)) onQuality(input.value);
      });
    }
    this.toggle.addEventListener('click', () => {
      const collapsed = this.telemetry.dataset.collapsed !== 'true';
      this.telemetry.dataset.collapsed = String(collapsed);
      this.toggle.setAttribute('aria-expanded', String(!collapsed));
      this.toggle.textContent = collapsed ? 'Show panel' : 'Hide panel';
    });
    // The strip's height changes as it wraps or collapses; the tape note sits above it.
    new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        '--strip-height',
        `${this.telemetry.offsetHeight}px`,
      );
    }).observe(this.telemetry);
  }

  setState(state: SceneState): void {
    document.documentElement.dataset.sceneState = state;
  }

  setBackend(name: BackendName, forced: boolean): void {
    document.documentElement.dataset.backend = name;
    this.backendEl.textContent = forced ? `${backendLabel(name)} (forced)` : backendLabel(name);
  }

  setQuality(level: QualityLevel): void {
    document.documentElement.dataset.quality = level;
    for (const input of this.qualityInputs) input.checked = input.value === level;
  }

  setFrameStats(frameMs: number, fps: number): void {
    this.frameEl.textContent = frameMs.toFixed(1);
    this.fpsEl.textContent = String(Math.round(fps));
  }

  showFault(title: string, body: string): void {
    showFault(title, body);
  }
}
