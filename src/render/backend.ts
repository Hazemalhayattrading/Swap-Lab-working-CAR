/**
 * Which GPU backend to ask for. WebGPU is the default; WebGPURenderer falls back
 * to WebGL 2 on its own when WebGPU is missing. `?renderer=webgl` forces the
 * fallback so it can be tested and compared on machines that do have WebGPU.
 */
export type BackendRequest = 'auto' | 'webgl';

/** What actually ended up running. */
export type BackendName = 'webgpu' | 'webgl2';

export function parseBackendRequest(search: string): BackendRequest {
  const value = new URLSearchParams(search).get('renderer')?.toLowerCase();
  return value === 'webgl' || value === 'webgl2' ? 'webgl' : 'auto';
}

export function backendLabel(name: BackendName): string {
  return name === 'webgpu' ? 'WebGPU' : 'WebGL 2';
}
