import type { PistonEngine, RotaryEngine } from './schema/engine';

/**
 * How much an engine breathes per turn of its output shaft. This is where the
 * rotary's displacement and cycle convention lives (docs/decisions.md, "Rotary
 * displacement and cycle convention"), so the Phase 2 airflow model never
 * treats a rotary as a four-stroke piston engine.
 *
 * - Four-stroke piston engine: each cylinder breathes once every two crank
 *   turns, so one crank turn draws in displacement / 2.
 * - Rotary (Wankel): the eccentric shaft turns three times per rotor turn, and
 *   each of the rotor's three chambers completes one intake-compression-power-
 *   exhaust cycle per rotor turn. So every rotor breathes one chamber
 *   displacement, and fires once, per shaft turn. One shaft turn draws in
 *   rotors x chamber displacement, which is the displacement Mazda quotes
 *   (13B: 654 cc x 2 = 1,308 cc).
 *
 * rpm is always output-shaft rpm (crank or eccentric shaft): what the
 * tachometer shows and what every rating is quoted at.
 */

/** The fields these helpers need; any engine from the data files has them. */
export type Breathing =
  | Pick<RotaryEngine, 'layout' | 'rotors' | 'displacement'>
  | Pick<PistonEngine, 'layout' | 'cylinders' | 'displacement'>;

/** Volume drawn in per output-shaft revolution at 100 % volumetric efficiency, in cc. */
export function intakeVolumePerRevCc(engine: Breathing): number {
  const cc = engine.displacement.value; // the only displacement unit is cc
  return engine.layout === 'rotary' ? cc : cc / 2;
}

/** Combustion events per output-shaft revolution (sound synthesis, cutaway timing). */
export function firingsPerRev(engine: Breathing): number {
  return engine.layout === 'rotary' ? engine.rotors : engine.cylinders / 2;
}

/**
 * Theoretical swept volume of one Wankel working chamber (its largest minus its
 * smallest volume), in cc, from the generating radius R, eccentricity e and
 * rotor width B in mm: 3·√3·R·e·B. The validator checks the maker's chamber
 * figure against it.
 */
export function wankelChamberDisplacementCc(rMm: number, eMm: number, bMm: number): number {
  return (3 * Math.sqrt(3) * rMm * eMm * bMm) / 1000;
}
