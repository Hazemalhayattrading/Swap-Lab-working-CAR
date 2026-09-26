import { Color, FogExp2, RectAreaLightNode, Scene, type WebGPURenderer } from 'three/webgpu';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { GaragePipeline } from '../render/pipeline';
import { QUALITY, pixelRatioFor, type QualityLevel } from '../render/quality';
import { applyEnvironment } from '../scene/environment';
import { buildGarage, type GarageRig } from '../scene/garage';
import { createCameraRig, type CameraRig } from '../scene/camera';

let ltcRegistered = false;

/** The 3D garage: scene, camera rig, lighting environment and render pipeline. */
export class GarageView {
  readonly scene = new Scene();
  private readonly rig: CameraRig;
  private readonly garage: GarageRig;
  private readonly pipeline: GaragePipeline;
  private quality: QualityLevel;

  /** Id of the HDRI in use, or `none` if it failed to load. */
  environmentId = 'none';

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly canvas: HTMLCanvasElement,
    quality: QualityLevel,
  ) {
    if (!ltcRegistered) {
      // Area lights need their lookup tables registered once for the node renderer.
      RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
      ltcRegistered = true;
    }
    this.quality = quality;
    this.scene.background = new Color('#0d0e10');
    this.scene.fog = new FogExp2('#0d0e10', 0.03);
    this.garage = buildGarage();
    this.scene.add(this.garage.root);
    this.rig = createCameraRig(canvas);
    this.pipeline = new GaragePipeline(renderer, this.scene, this.rig.camera, quality);
    this.applyRenderSettings();
    this.resize();
  }

  static async create(
    renderer: WebGPURenderer,
    canvas: HTMLCanvasElement,
    quality: QualityLevel,
    baseUrl: string,
  ): Promise<GarageView> {
    const view = new GarageView(renderer, canvas, quality);
    try {
      const texture = await applyEnvironment(view.scene, baseUrl);
      view.environmentId = texture.name;
    } catch (error) {
      // The shop still renders with its own lights; reflections are just flatter.
      console.warn('Environment HDRI failed to load; continuing without it.', error);
    }
    // Compile every material before the first visible frame to avoid a hitch.
    await view.pipeline.compile();
    return view;
  }

  setQuality(level: QualityLevel): void {
    if (level === this.quality) return;
    this.quality = level;
    this.applyRenderSettings();
    this.pipeline.setQuality(level);
  }

  resize(): void {
    this.renderer.setPixelRatio(pixelRatioFor(this.quality, window.devicePixelRatio));
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.renderer.setSize(width, height, false);
    this.rig.resize(width, height);
  }

  render(): void {
    this.rig.update();
    this.pipeline.render();
  }

  /** Camera position in metres, for diagnostics and tests. */
  cameraPosition(): number[] {
    return this.rig.camera.position.toArray();
  }

  /** Keyboard camera control for the focused view (arrows orbit, +/- move closer or further). */
  handleKey(key: string): boolean {
    return this.rig.handleKey(key);
  }

  private applyRenderSettings(): void {
    const { shadowMapSize } = QUALITY[this.quality];
    this.renderer.setPixelRatio(pixelRatioFor(this.quality, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = shadowMapSize > 0;
    for (const light of this.garage.shadowLights) {
      light.castShadow = shadowMapSize > 0;
      if (shadowMapSize > 0 && light.shadow.mapSize.x !== shadowMapSize) {
        light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
        // Drop the old map so it is reallocated at the new size.
        light.shadow.map?.dispose();
        light.shadow.map = null;
      }
    }
  }
}
