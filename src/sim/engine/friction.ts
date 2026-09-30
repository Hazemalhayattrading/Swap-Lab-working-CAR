import type { ModelConstants, SimEngine } from '../../data/sim-data';

/**
 * Friction mean effective pressure at wide-open throttle, Pa: rubbing
 * friction, the accessories a net rating includes (oil and water pumps,
 * alternator) and naturally aspirated pumping.
 *
 * - Piston engines: a quadratic in mean piston speed (2 x stroke x rev/s),
 *   which is what rubbing and pumping losses scale with.
 * - Rotaries: a quadratic in eccentric-shaft speed (no reciprocating parts;
 *   seal and bearing friction).
 */
export function frictionMep(engine: SimEngine, rpm: number, k: ModelConstants): number {
  if (engine.layout === 'rotary') {
    const krpm = rpm / 1000;
    return k['fmep-rotary-a'] + k['fmep-rotary-b'] * krpm + k['fmep-rotary-c'] * krpm * krpm;
  }
  const pistonSpeed = (2 * engine.stroke * rpm) / 60;
  return (
    k['fmep-piston-a'] +
    k['fmep-piston-b'] * pistonSpeed +
    k['fmep-piston-c'] * pistonSpeed * pistonSpeed
  );
}

/**
 * Torque from a mean effective pressure, N·m. `volumePerRev` is what the
 * engine draws in per output-shaft revolution (src/data/displacement.ts), so
 * the same formula serves four-strokes (displacement / 2) and rotaries
 * (the full displacement): work per rev = MEP x volumePerRev.
 */
export function mepTorque(mep: number, volumePerRev: number): number {
  return (mep * volumePerRev) / (2 * Math.PI);
}
