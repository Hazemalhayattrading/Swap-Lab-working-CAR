import {
  color,
  floor,
  float,
  fract,
  hash,
  min,
  mix,
  mod,
  positionView,
  length,
  sin,
  smoothstep,
  step,
  uv,
  vec2,
  vec3,
  mx_noise_float,
} from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { bumpNormal, falloff, fbm01, lineCoverage } from './tsl-utils';

/**
 * Procedural PBR surfaces for the shop shell. All of them read `uv()` as metres
 * (see `metricPlane` in garage.ts), so patterns keep real-world scale.
 */

/**
 * Painted concrete block (CMU) wall, 400 x 200 mm blocks in running bond, with a
 * darker scuff-resistant band along the bottom as most workshops have.
 */
export function createBlockWallMaterial(bandHeight = 1.2): MeshStandardNodeMaterial {
  const p = uv();
  const nearDetail = falloff(3, 12, length(positionView));
  const row = floor(p.y.div(0.2));
  const offset = mod(row, 2).mul(0.2);
  const bx = fract(p.x.add(offset).div(0.4));
  const by = fract(p.y.div(0.2));
  const edgeDist = min(min(bx, float(1).sub(bx)).mul(0.4), min(by, float(1).sub(by)).mul(0.2));
  const mortar = lineCoverage(edgeDist, 0.005);

  const blockId = vec2(floor(p.x.add(offset).div(0.4)), row);
  const blockTint = hash(blockId.x.mul(17.0).add(blockId.y.mul(131.0)))
    .sub(0.5)
    .mul(0.1);
  const pores = mx_noise_float(vec3(p.mul(90), 1.3));
  const grime = fbm01(p, 0.6, 3, 4.0);

  const band = step(p.y, bandHeight);
  const bandEdge = lineCoverage(p.y.sub(bandHeight).abs(), 0.012);
  const upperPaint = color('#6a6965');
  const lowerPaint = color('#2c2e31');
  let albedo = mix(upperPaint, lowerPaint, band);
  albedo = albedo.mul(float(1).add(blockTint)).mul(float(1).sub(grime.mul(0.3)));
  // Scuffs and splash marks low on the wall.
  const scuffs = smoothstep(0.6, 0.8, fbm01(vec2(p.x.mul(1.4), p.y.mul(4)), 1, 3, 9.0)).mul(
    falloff(0.2, 0.9, p.y),
  );
  albedo = mix(albedo, color('#17181a'), scuffs.mul(0.5));
  albedo = mix(albedo, albedo.mul(0.72), mortar);
  albedo = mix(albedo, color('#b8891c'), bandEdge.mul(0.8));

  const material = new MeshStandardNodeMaterial();
  material.name = 'block-wall';
  material.colorNode = albedo;
  material.roughnessNode = mix(float(0.82), float(0.6), band).add(mortar.mul(0.12));
  material.metalnessNode = float(0);
  material.normalNode = bumpNormal(
    pores.mul(0.25).mul(nearDetail).sub(mortar.mul(1.2)),
    float(0.01),
  );
  return material;
}

/** Steel roller door: 75 mm corrugated slats, painted, with dust collected in the troughs. */
export function createRollerDoorMaterial(): MeshStandardNodeMaterial {
  const p = uv();
  const phase = p.y.div(0.075).mul(Math.PI * 2);
  const corrugation = sin(phase);
  const trough = smoothstep(0.3, 1, corrugation.negate());
  const dirt = fbm01(p, 0.9, 3, 12.0);
  let albedo = mix(color('#6f7478'), color('#50555a'), dirt.mul(0.6));
  albedo = mix(albedo, color('#2a2b2c'), trough.mul(0.35));
  albedo = albedo.mul(float(1).sub(falloff(0, 0.5, p.y).mul(0.35)));

  const material = new MeshStandardNodeMaterial();
  material.name = 'roller-door';
  material.colorNode = albedo;
  material.roughnessNode = mix(float(0.42), float(0.7), dirt).add(trough.mul(0.15));
  material.metalnessNode = float(0.55);
  material.normalNode = bumpNormal(corrugation, float(0.035));
  return material;
}

/** Bare ceiling slab and painted structural steel, deliberately dark. */
export function createCeilingMaterial(): MeshStandardNodeMaterial {
  const p = uv();
  const stains = fbm01(p, 0.35, 3, 2.0);
  const material = new MeshStandardNodeMaterial();
  material.name = 'ceiling';
  material.colorNode = mix(color('#232426'), color('#151617'), stains);
  material.roughnessNode = float(0.92);
  material.metalnessNode = float(0);
  return material;
}

export function createPaintedSteelMaterial(hex = '#2e3134'): MeshStandardNodeMaterial {
  const p = uv();
  const wear = fbm01(p, 3.0, 3, 5.0);
  const material = new MeshStandardNodeMaterial();
  material.name = 'painted-steel';
  material.colorNode = mix(color(hex), color(hex).mul(0.7), wear.mul(0.5));
  material.roughnessNode = mix(float(0.45), float(0.7), wear);
  material.metalnessNode = float(0.35);
  return material;
}
