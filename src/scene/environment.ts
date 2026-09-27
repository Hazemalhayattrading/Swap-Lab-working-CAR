import {
  DataUtils,
  EquirectangularReflectionMapping,
  FloatType,
  HalfFloatType,
  type DataTexture,
  type Scene,
} from 'three/webgpu';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import manifest from '../data/assets.json';
import { applyNightGrade } from './night-grade';

/** The HDRI used for image-based lighting. Its licence and origin live in src/data/assets.json. */
export const ENVIRONMENT_ASSET_ID = 'autoshop_01';

export function environmentFileUrl(assetId: string, baseUrl: string): string {
  const asset = manifest.assets.find((a) => a.id === assetId);
  const file = asset?.files.find((f) => f.startsWith('public/'));
  if (!file) throw new Error(`Environment asset "${assetId}" has no public file in the manifest.`);
  return `${baseUrl}${file.slice('public/'.length)}`;
}

/**
 * Loads the HDRI as the scene's lighting environment (reflections and ambient).
 * It is never drawn as the background: the modelled shop shell is what you see.
 *
 * The file is decoded as 32-bit float so the night grade (night-grade.ts) can
 * dim the daylight skylights, then packed to half float for the GPU, which is
 * what EXRLoader would have produced anyway.
 */
export async function applyEnvironment(scene: Scene, baseUrl: string): Promise<DataTexture> {
  const loader = new EXRLoader().setDataType(FloatType);
  const texture = await loader.loadAsync(environmentFileUrl(ENVIRONMENT_ASSET_ID, baseUrl));
  const floats = texture.image.data as unknown as Float32Array;
  applyNightGrade(floats);
  const halves = new Uint16Array(floats.length);
  for (let i = 0; i < floats.length; i++) halves[i] = DataUtils.toHalfFloat(floats[i] ?? 0);
  texture.image.data = halves;
  texture.type = HalfFloatType;
  texture.mapping = EquirectangularReflectionMapping;
  texture.name = ENVIRONMENT_ASSET_ID;
  texture.needsUpdate = true;
  scene.environment = texture;
  // The strip lights are the key light; the HDRI only fills and gives reflections.
  scene.environmentIntensity = 0.08;
  return texture;
}
