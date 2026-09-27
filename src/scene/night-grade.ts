/**
 * Turns a daytime workshop HDRI into a night-shift one, in place.
 *
 * Poly Haven's Autoshop 01 is lit by fluorescent strips (near neutral at its
 * 5050 K white balance) and by roof skylights (daylight, clearly bluer). At
 * night the skylights would be dark, and left in they put blue glints on the
 * oil stains that no light in our bay explains. So bright pixels that are
 * clearly bluer than neutral are dimmed; the strips and the dim room fill stay.
 *
 * Pure function over linear RGBA floats, so it can be unit-tested.
 */

export interface NightGradeOptions {
  /** Blue/red ratio where dimming starts, and where it's at full strength. */
  coolFrom: number;
  coolTo: number;
  /** Luminance where dimming starts, and where it's at full strength. */
  brightFrom: number;
  brightTo: number;
  /** How much of a fully cool, fully bright pixel is removed (0..1). */
  strength: number;
}

export const NIGHT_GRADE: NightGradeOptions = {
  coolFrom: 1.12,
  coolTo: 1.3,
  brightFrom: 0.6,
  brightTo: 2,
  strength: 0.97,
};

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Returns the share of total luminance removed, for logging and tests. */
export function applyNightGrade(
  rgba: Float32Array,
  options: NightGradeOptions = NIGHT_GRADE,
): number {
  let before = 0;
  let removed = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    before += luminance;
    if (luminance < options.brightFrom || r <= 0) continue;
    const dim =
      options.strength *
      smoothstep(options.coolFrom, options.coolTo, b / r) *
      smoothstep(options.brightFrom, options.brightTo, luminance);
    if (dim === 0) continue;
    const keep = 1 - dim;
    rgba[i] = r * keep;
    rgba[i + 1] = g * keep;
    rgba[i + 2] = b * keep;
    removed += luminance * dim;
  }
  return before > 0 ? removed / before : 0;
}
