import {
  CubeUVReflectionMapping,
  DataTexture,
  LinearFilter,
  LinearSRGBColorSpace,
  RGBFormat,
  UnsignedInt5999Type,
  type Scene,
} from 'three/webgpu';
import manifest from '../data/assets.json';
import { decodeEnvironment, isGzip } from './pmrem-file';

/** The HDRI used for image-based lighting. Its licence and origin live in src/data/assets.json. */
export const ENVIRONMENT_ASSET_ID = 'autoshop_01';

export function environmentFileUrl(assetId: string, baseUrl: string): string {
  const asset = manifest.assets.find((a) => a.id === assetId);
  const file = asset?.files.find((f) => f.startsWith('public/'));
  if (!file) throw new Error(`Environment asset "${assetId}" has no public file in the manifest.`);
  return `${baseUrl}${file.slice('public/'.length)}`;
}

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

/**
 * Loads the baked environment as the scene's lighting (reflections and ambient).
 * It is never drawn as the background: the modelled shop shell is what you see.
 *
 * The file is Poly Haven's Autoshop 01, night-graded (night-grade.ts) and
 * prefiltered offline by scripts/bake-environment.ts into three's cube-UV
 * atlas, stored as RGB9E5 and gzipped (pmrem-file.ts). A texture with
 * CubeUVReflectionMapping is used as it is, so the browser neither decodes an
 * EXR nor prefilters anything at start-up. If a server already undid the
 * gzip (Content-Encoding), the bytes are used as they come.
 */
export async function applyEnvironment(scene: Scene, baseUrl: string): Promise<DataTexture> {
  const response = await fetch(environmentFileUrl(ENVIRONMENT_ASSET_ID, baseUrl));
  if (!response.ok) throw new Error(`Environment map: HTTP ${String(response.status)}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const atlas = decodeEnvironment(isGzip(bytes) ? await gunzip(bytes) : bytes.buffer);
  const texture = new DataTexture(
    atlas.texels,
    atlas.width,
    atlas.height,
    RGBFormat,
    UnsignedInt5999Type,
  );
  texture.mapping = CubeUVReflectionMapping;
  texture.colorSpace = LinearSRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.name = ENVIRONMENT_ASSET_ID;
  texture.needsUpdate = true;
  scene.environment = texture;
  // The strip lights are the key light; the HDRI only fills and gives reflections.
  scene.environmentIntensity = 0.08;
  return texture;
}
