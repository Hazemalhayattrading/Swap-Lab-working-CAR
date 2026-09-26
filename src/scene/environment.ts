import { EquirectangularReflectionMapping, type Scene, type Texture } from 'three/webgpu';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import manifest from '../data/assets.json';

/** The HDRI used for image-based lighting. Its licence and origin live in src/data/assets.json. */
export const ENVIRONMENT_ASSET_ID = 'empty_warehouse_01';

export function environmentFileUrl(assetId: string, baseUrl: string): string {
  const asset = manifest.assets.find((a) => a.id === assetId);
  const file = asset?.files.find((f) => f.startsWith('public/'));
  if (!file) throw new Error(`Environment asset "${assetId}" has no public file in the manifest.`);
  return `${baseUrl}${file.slice('public/'.length)}`;
}

/**
 * Loads the HDRI as the scene's lighting environment (reflections and ambient).
 * It is never drawn as the background: the modelled shop shell is what you see.
 */
export async function applyEnvironment(scene: Scene, baseUrl: string): Promise<Texture> {
  const texture = await new EXRLoader().loadAsync(
    environmentFileUrl(ENVIRONMENT_ASSET_ID, baseUrl),
  );
  texture.mapping = EquirectangularReflectionMapping;
  texture.name = ENVIRONMENT_ASSET_ID;
  scene.environment = texture;
  // The strip lights are the key light; the HDRI only fills and gives reflections.
  scene.environmentIntensity = 0.08;
  return texture;
}
