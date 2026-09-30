import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './ui/styles.css';
import './ui/dyno/dyno.css';

import { GarageView } from './app/garage-view';
import { SimClient } from './app/sim-client';
import { parseBackendRequest } from './render/backend';
import { createRenderer } from './render/renderer';
import { resolveQuality, type QualityLevel } from './render/quality';
import { installWebGpuCompat } from './render/webgpu-compat';
import { DynoPanel } from './ui/dyno/panel';
import { FrameMeter } from './ui/frame-meter';
import { Hud, showStartupFault } from './ui/hud';

const QUALITY_STORAGE_KEY = 'swaplab.quality';

function readStoredQuality(): string | null {
  try {
    return localStorage.getItem(QUALITY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeQuality(level: QualityLevel): void {
  try {
    localStorage.setItem(QUALITY_STORAGE_KEY, level);
  } catch {
    // Private mode or storage disabled: the choice just won't persist.
  }
}

/** The dyno sheet runs on its own worker and doesn't need the 3D view, so it starts first. */
function startDyno(): void {
  const panel = new DynoPanel(new SimClient());
  void panel.start();
}

async function boot(): Promise<void> {
  startDyno();
  installWebGpuCompat();
  const canvas = document.getElementById('viewport') as HTMLCanvasElement;
  const backendRequest = parseBackendRequest(location.search);
  let quality = resolveQuality(location.search, readStoredQuality());

  // Created once the renderer and scene are ready; quality clicks before that
  // are remembered and applied when it exists.
  let view: GarageView | undefined = undefined;
  const hud = new Hud(quality, (level) => {
    quality = level;
    storeQuality(level);
    hud.setQuality(level);
    view?.setQuality(level);
  });

  let created: Awaited<ReturnType<typeof createRenderer>>;
  try {
    created = await createRenderer(canvas, backendRequest);
  } catch (error) {
    console.error(error);
    hud.showFault(
      'This garage needs WebGPU or WebGL 2',
      'Your browser could not start either one. Update the browser, or turn on hardware acceleration in its settings, then reload this page.',
    );
    return;
  }
  const { renderer, backend } = created;
  hud.setBackend(backend, backendRequest === 'webgl');

  // Surface WebGPU validation errors in the console instead of failing silently.
  const device = (renderer.backend as { device?: GPUDevice }).device;
  device?.addEventListener('uncapturederror', (event) => {
    console.error('WebGPU error:', event.error.message);
  });
  // Keep three's own handler (it stops rendering on a lost device), then stop our loop too.
  const defaultDeviceLost = renderer.onDeviceLost.bind(renderer);
  renderer.onDeviceLost = (info) => {
    defaultDeviceLost(info);
    void renderer.setAnimationLoop(null);
    hud.showFault('The graphics device stopped', 'Reload the page to start the garage again.');
  };

  // Listen before the slow start-up steps, so a rotation or resize during loading isn't lost.
  window.addEventListener('resize', () => {
    view?.resize();
  });
  canvas.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (view?.handleKey(event.key)) event.preventDefault();
  });

  const garage = await GarageView.create(renderer, canvas, quality, import.meta.env.BASE_URL);
  view = garage;
  garage.setQuality(quality);
  garage.resize();
  document.documentElement.dataset.environment = garage.environmentId;

  const meter = new FrameMeter();
  let frames = 0;
  // Count draw calls over the whole frame (scene, shadow and post passes), not per pass.
  renderer.info.autoReset = false;
  const lastFrame = { drawCalls: 0, triangles: 0 };
  void renderer.setAnimationLoop((time) => {
    renderer.info.reset();
    garage.render();
    lastFrame.drawCalls = renderer.info.render.drawCalls;
    lastFrame.triangles = renderer.info.render.triangles;
    frames++;
    const stats = meter.sample(time);
    if (stats) hud.setFrameStats(stats.frameMs, stats.fps);
    if (frames === 2 && document.documentElement.dataset.sceneState === 'loading') {
      hud.setState('ready');
    }
  });

  // Diagnostics for tests and profiling (threejs-debug-profiler skill).
  Object.assign(window, {
    __SWAPLAB__: {
      backend,
      get quality() {
        return quality;
      },
      get frames() {
        return frames;
      },
      lastFrame,
      memory: renderer.info.memory,
      get camera() {
        return garage.cameraPosition();
      },
    },
  });
}

boot().catch((error: unknown) => {
  console.error(error);
  showStartupFault();
});
