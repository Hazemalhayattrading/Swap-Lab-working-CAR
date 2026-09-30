import type { WebGPURenderer } from 'three/webgpu';
import type { BackendName } from './backend';
import type { GpuIdentity } from './software-renderer';

/** The renderer string of a WebGL 2 context, unmasked where the browser allows it. */
function webglRendererOf(gl: WebGL2RenderingContext): string | undefined {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const value: unknown = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  return typeof value === 'string' ? value : undefined;
}

/** Opens a throwaway WebGL 2 context just to read its renderer string. */
function probeWebgl(): string | undefined {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return undefined;
  try {
    return webglRendererOf(gl);
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/**
 * What the browser says about the GPU it draws with: the WebGPU adapter's info
 * (three doesn't keep its adapter, so this asks for one the same way) and a
 * WebGL 2 renderer string (the running context on the WebGL backend, or a
 * throwaway probe when WebGPU gives no names).
 */
export async function readGpuIdentity(
  renderer: WebGPURenderer,
  backend: BackendName,
): Promise<GpuIdentity> {
  const id: GpuIdentity = {};
  if (backend === 'webgpu' && 'gpu' in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (adapter) {
        // Older browsers lack some of these fields (isFallbackAdapter moved from the
        // adapter to its info in 2024), so read them as optional.
        const info: {
          vendor?: string;
          architecture?: string;
          device?: string;
          description?: string;
          isFallbackAdapter?: boolean;
        } = adapter.info;
        const legacy = (adapter as unknown as { isFallbackAdapter?: boolean }).isFallbackAdapter;
        id.webgpu = {
          vendor: info.vendor,
          architecture: info.architecture,
          device: info.device,
          description: info.description,
          ...(info.isFallbackAdapter !== undefined || legacy !== undefined
            ? { isFallbackAdapter: info.isFallbackAdapter ?? legacy === true }
            : {}),
        };
      }
    } catch {
      // No adapter info: fall through to the WebGL probe.
    }
  }
  try {
    const gl =
      backend === 'webgl2' ? (renderer.backend as { gl?: WebGL2RenderingContext }).gl : undefined;
    const named = [id.webgpu?.vendor, id.webgpu?.architecture, id.webgpu?.description].some(
      (s) => typeof s === 'string' && s.length > 0,
    );
    const webglRenderer = gl ? webglRendererOf(gl) : named ? undefined : probeWebgl();
    if (webglRenderer) id.webglRenderer = webglRenderer;
  } catch {
    // A browser that refuses the probe just gets no verdict from it.
  }
  return id;
}
