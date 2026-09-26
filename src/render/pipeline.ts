import {
  RenderPipeline,
  type Camera,
  type PassNode,
  type Scene,
  type WebGPURenderer,
} from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom, type default as BloomNode } from 'three/addons/tsl/display/BloomNode.js';
import { QUALITY, type QualityLevel } from './quality';

interface Graph {
  pipeline: RenderPipeline;
  scenePass: PassNode;
  bloomPass: BloomNode | null;
}

/**
 * Scene pass (HDR, optional MSAA) -> optional bloom on emissive fixtures ->
 * tone mapping and sRGB output (applied by the renderer's output transform).
 */
export class GaragePipeline {
  private graph: Graph;

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly scene: Scene,
    private readonly camera: Camera,
    level: QualityLevel,
  ) {
    this.graph = this.build(level);
  }

  private build(level: QualityLevel): Graph {
    const settings = QUALITY[level];
    const scenePass = pass(this.scene, this.camera, { samples: settings.msaaSamples });
    const color = scenePass.getTextureNode('output');
    // Threshold is in linear HDR units: only the diffusers and lamp lens bloom, and
    // only as a tight halo. Wider or stronger settings wash the dark shop out grey.
    const bloomPass = settings.bloom ? bloom(color, 0.08, 0.05, 3) : null;
    const pipeline = new RenderPipeline(this.renderer);
    pipeline.outputNode = bloomPass ? color.add(bloomPass) : color;
    return { pipeline, scenePass, bloomPass };
  }

  /** Compiles scene materials against the scene pass's own render target. */
  async compile(): Promise<void> {
    await this.graph.scenePass.compileAsync(this.renderer);
  }

  setQuality(level: QualityLevel): void {
    this.disposeGraph();
    this.graph = this.build(level);
  }

  render(): void {
    this.graph.pipeline.render();
  }

  dispose(): void {
    this.disposeGraph();
  }

  /** RenderPipeline.dispose() only frees its quad; the pass and bloom targets are ours to free. */
  private disposeGraph(): void {
    this.graph.pipeline.dispose();
    this.graph.scenePass.dispose();
    this.graph.bloomPass?.dispose();
  }
}
