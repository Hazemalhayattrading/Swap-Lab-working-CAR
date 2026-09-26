import { AgXToneMapping, PCFShadowMap, SRGBColorSpace, WebGPURenderer } from 'three/webgpu';
import type { BackendName, BackendRequest } from './backend';

export interface CreatedRenderer {
  renderer: WebGPURenderer;
  backend: BackendName;
}

/**
 * Creates the renderer. With `auto`, WebGPURenderer tries WebGPU first and falls
 * back to its WebGL 2 backend by itself. Rejects if neither is available.
 */
export async function createRenderer(
  canvas: HTMLCanvasElement,
  request: BackendRequest,
): Promise<CreatedRenderer> {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: false, // MSAA happens in the scene pass (see pipeline.ts).
    forceWebGL: request === 'webgl',
    powerPreference: 'high-performance',
  });
  await renderer.init();

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const backend: BackendName =
    (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true
      ? 'webgpu'
      : 'webgl2';
  return { renderer, backend };
}
