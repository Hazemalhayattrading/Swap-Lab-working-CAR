import {
  Fn,
  abs,
  clamp,
  float,
  fract,
  fwidth,
  length,
  max,
  min,
  mx_fractal_noise_float,
  normalView,
  positionView,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

type FloatNode = Node<'float'>;
type Vec2Node = Node<'vec2'>;

/**
 * Fractal Perlin noise remapped to roughly [0, 1].
 * `seed` offsets the third dimension so layers built from it are uncorrelated.
 */
export function fbm01(p: Vec2Node, frequency: number, octaves: number, seed: number): FloatNode {
  return mx_fractal_noise_float(vec3(p.mul(frequency), seed), octaves, 2, 0.5)
    .mul(0.6)
    .add(0.5)
    .clamp(0, 1);
}

/**
 * 1 at `x <= near`, 0 at `x >= far`, smooth in between. Use this instead of
 * smoothstep with reversed edges, which GLSL leaves undefined.
 */
export function falloff(near: number, far: number, x: FloatNode): FloatNode {
  return float(1).sub(smoothstep(near, far, x));
}

/**
 * Anti-aliased coverage of a line of half-width `halfWidth` at distance `d`.
 * Fades to the line's average coverage when the line gets thinner than a pixel,
 * so saw cuts and paint lines don't shimmer at a distance.
 */
export function lineCoverage(d: FloatNode, halfWidth: number): FloatNode {
  const fw = max(fwidth(d), 1e-5);
  const edge = float(1).sub(smoothstep(float(halfWidth).sub(fw), float(halfWidth).add(fw), d));
  return edge.mul(clamp(float(halfWidth * 2).div(fw), 0, 1));
}

/** Distance in metres to the nearest line of a grid with `spacing`, offset by half a cell. */
export function gridDistance(coord: FloatNode, spacing: number): FloatNode {
  return abs(fract(coord.div(spacing)).sub(0.5)).mul(spacing);
}

/** Signed distance from `p` to an axis-aligned box of half-extents `b`. */
export function sdBox2(p: Vec2Node, b: Vec2Node): FloatNode {
  const q = abs(p).sub(b);
  return length(max(q, vec2(0))).add(min(max(q.x, q.y), 0));
}

/**
 * Perturbs the view-space normal from a procedural height field using screen-space
 * derivatives (Mikkelsen, "Bump Mapping Unparametrized Surfaces on the GPU").
 * three's bumpMap() expects a texture; this works on any float node.
 */
export const bumpNormal = Fn(([height, scale]: [FloatNode, FloatNode]) => {
  const dHdxy = vec2(height.dFdx(), height.dFdy()).mul(scale);
  const sigmaX = positionView.dFdx().normalize();
  const sigmaY = positionView.dFdy().normalize();
  const n = normalView;
  const r1 = sigmaY.cross(n);
  const r2 = n.cross(sigmaX);
  const det = sigmaX.dot(r1);
  const grad = det.sign().mul(dHdxy.x.mul(r1).add(dHdxy.y.mul(r2)));
  return det.abs().mul(n).sub(grad).normalize();
});
