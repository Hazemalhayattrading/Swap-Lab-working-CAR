import {
  abs,
  clamp,
  color,
  float,
  length,
  max,
  mix,
  mx_noise_float,
  mx_worley_noise_float_2d,
  positionView,
  positionWorld,
  smoothstep,
  step,
  vec2,
  vec3,
} from 'three/tsl';
import { MeshPhysicalNodeMaterial, type Node } from 'three/webgpu';
import { bumpNormal, falloff, fbm01, gridDistance, lineCoverage, sdBox2 } from './tsl-utils';

/**
 * Procedural sealed-concrete shop floor, in world metres.
 *
 * Interim, procedural PBR, because no scanned CC0 texture source was reachable
 * from the build environment on 2026-09-26 (see docs/decisions.md). Layers:
 * cure mottling, aggregate grain, saw-cut control joints on a 3 m grid, worn
 * yellow bay lines, oil drips under the engine and gearbox, a steel trench drain,
 * and a clear sealer coat that is thinner where traffic has worn it.
 */

/** Where the lift bay sits. The car's nose points to +z. */
export const BAY = {
  halfWidth: 1.75,
  halfLength: 3.1,
  /** Engine drip zone and gearbox/diff drip zone, [x, z] in metres. */
  dripZones: [
    [0.05, 1.35],
    [-0.1, -0.35],
    [0.0, -1.7],
  ],
  drainZ: -4.6,
  drainHalfLength: 3.0,
} as const;

export function createConcreteFloorMaterial(): MeshPhysicalNodeMaterial {
  const p = positionWorld.xz;
  const viewDistance = length(positionView);
  // Fine detail fades out with distance so it never turns into shimmer.
  const nearDetail = falloff(3, 14, viewDistance);

  // Cure and trowel mottling: broad, low-contrast tone drift plus mid-scale patches.
  const mottle = fbm01(p, 0.16, 3, 0.0);
  const patch = fbm01(p, 1.1, 3, 7.3);
  // Exposed aggregate: sparse light and dark speckles.
  const grainNoise = mx_noise_float(vec3(p.mul(62), 3.1));
  const speckLight = smoothstep(0.45, 0.65, grainNoise);
  const speckDark = falloff(-0.65, -0.45, grainNoise);
  // Tyre scuffs: faint dark streaks along the bay's long axis, where cars roll in.
  const scuff = smoothstep(0.66, 0.84, fbm01(vec2(p.x.mul(6.0), p.y.mul(0.3)), 1, 3, 11.0)).mul(
    falloff(1.1, 1.5, abs(p.x)),
  );

  const concreteDark = color('#3b3a38');
  const concreteMid = color('#4a4845');
  const concreteLight = color('#57554f');
  let albedo = mix(concreteDark, concreteMid, mottle);
  albedo = mix(albedo, concreteLight, smoothstep(0.45, 0.8, patch).mul(0.5));
  albedo = albedo.mul(
    float(1).add(speckLight.mul(0.2).mul(nearDetail)).sub(speckDark.mul(0.25).mul(nearDetail)),
  );
  albedo = albedo.mul(float(1).sub(scuff.mul(0.22)));

  // Saw-cut control joints, 6 mm wide, on a 3 m grid.
  const jointDist = max(
    lineCoverage(gridDistance(p.x, 3.0), 0.003),
    lineCoverage(gridDistance(p.y, 3.0), 0.003),
  );

  // Painted bay outline, 90 mm lines: mostly intact, chipped and scuffed in places.
  const bayDist = abs(sdBox2(p, vec2(BAY.halfWidth, BAY.halfLength)));
  const worn = smoothstep(0.64, 0.8, fbm01(p, 3.5, 3, 21.0));
  const chips = smoothstep(0.7, 0.85, fbm01(p, 40, 2, 5.0));
  const paint = lineCoverage(bayDist, 0.045).mul(float(1).sub(max(worn.mul(0.9), chips)));
  albedo = mix(albedo, color('#a47a1c'), paint.mul(0.8));

  // Oil: soaked-in stains under the drip zones plus a few stray drips across the slab.
  const stainShape = fbm01(p, 3.2, 3, 13.0);
  const warp = vec2(fbm01(p, 2.4, 2, 31.0), stainShape)
    .sub(0.5)
    .mul(0.35);
  let oil: Node<'float'> = float(0);
  for (const [x, z] of BAY.dripZones) {
    const d = length(p.add(warp).sub(vec2(x, z)));
    const r = d.mul(float(0.7).add(stainShape.mul(0.9)));
    // Soaked-in core with a fainter halo where the oil has wicked outwards.
    const blob = max(falloff(0.14, 0.3, r), falloff(0.28, 0.6, r).mul(0.35));
    oil = max(oil, blob);
  }
  const strayDrips = falloff(0.03, 0.09, mx_worley_noise_float_2d(p.mul(1.9), 1)).mul(
    smoothstep(0.7, 0.85, fbm01(p, 0.7, 2, 3.0)),
  );
  oil = clamp(max(oil, strayDrips.mul(0.7)), 0, 1);
  albedo = mix(albedo, albedo.mul(0.35), oil.mul(0.85));

  // Trench drain along the back of the bay: galvanised grate with slots.
  const drainLocal = vec2(p.x, p.y.sub(BAY.drainZ));
  const drainBox = sdBox2(drainLocal, vec2(BAY.drainHalfLength, 0.09));
  const inDrain = lineCoverage(max(drainBox, 0), 0.0005).max(step(drainBox, 0));
  const slot = lineCoverage(gridDistance(p.x, 0.028), 0.006).mul(step(abs(drainLocal.y), 0.07));
  const drainColor = mix(color('#5c5f61'), color('#0b0b0b'), slot);
  albedo = mix(albedo, drainColor, inDrain);

  // Joints are dark and dusty.
  albedo = mix(albedo, color('#1c1b1a'), jointDist.mul(0.85));

  // Roughness of the concrete under the sealer. Low enough in places that the
  // strip lights leave soft streaks on the slab.
  const baseRoughness = mix(float(0.4), float(0.62), patch)
    .add(scuff.mul(0.1))
    .sub(oil.mul(0.25))
    .add(jointDist.mul(0.3));

  // Clear sealer, worn down along the wheel tracks cars take from the roller door
  // into the bay (1.55 m track), with only mild wear elsewhere.
  const wheelTrack = falloff(0.12, 0.42, abs(abs(p.x).sub(0.78))).mul(smoothstep(-3.6, -1.4, p.y));
  const sealerWear = clamp(wheelTrack.mul(0.75).add(fbm01(p, 2.2, 2, 61.0).mul(0.35)), 0, 1);
  const clearcoat = mix(float(0.62), float(0.28), sealerWear)
    .mul(float(1).sub(jointDist))
    .mul(float(1).sub(inDrain.mul(0.7)))
    .add(oil.mul(0.3))
    .clamp(0, 1);
  const clearcoatRoughness = mix(float(0.14), float(0.3), sealerWear).sub(oil.mul(0.08));

  // Height for bump: grain pores, recessed joints and drain slots, raised paint.
  const height = grainNoise
    .mul(0.35)
    .mul(nearDetail)
    .sub(jointDist.mul(1.5))
    .add(paint.mul(0.4))
    .sub(slot.mul(inDrain).mul(2.0));

  const material = new MeshPhysicalNodeMaterial();
  material.name = 'concrete-floor';
  material.colorNode = albedo;
  material.roughnessNode = baseRoughness.clamp(0.08, 1);
  material.metalnessNode = inDrain.mul(float(1).sub(slot)).mul(0.85);
  material.clearcoatNode = clearcoat;
  material.clearcoatRoughnessNode = clearcoatRoughness.clamp(0.05, 1);
  material.normalNode = bumpNormal(height, float(0.012));
  return material;
}
