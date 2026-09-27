import { describe, expect, it } from 'vitest';
import {
  firingsPerRev,
  intakeVolumePerRevCc,
  wankelChamberDisplacementCc,
  type Breathing,
} from '../../src/data/displacement';

const cc = (value: number) => ({
  value,
  unit: 'cc' as const,
  confidence: 'single-source' as const,
  sources: [{ url: 'https://example.com/spec', accessed: '2026-09-27' }],
});
const sr20: Breathing = { layout: 'inline', cylinders: 4, displacement: cc(1998) };
const twoJz: Breathing = { layout: 'inline', cylinders: 6, displacement: cc(2997) };
const thirteenB: Breathing = { layout: 'rotary', rotors: 2, displacement: cc(1308) };
const twentyB: Breathing = { layout: 'rotary', rotors: 3, displacement: cc(1962) };

describe('displacement and cycle convention', () => {
  it('a four-stroke draws half its displacement per crank turn', () => {
    expect(intakeVolumePerRevCc(sr20)).toBe(999);
    expect(intakeVolumePerRevCc(twoJz)).toBe(1498.5);
  });

  it('a rotary draws its whole (Mazda-quoted) displacement per eccentric-shaft turn', () => {
    expect(intakeVolumePerRevCc(thirteenB)).toBe(1308);
    expect(intakeVolumePerRevCc(twentyB)).toBe(1962);
    // So a 1.3-litre 13B breathes like a 2.6-litre four-stroke at the same rpm.
    expect(intakeVolumePerRevCc(thirteenB)).toBe(
      2 * intakeVolumePerRevCc({ ...sr20, displacement: cc(1308) }),
    );
  });

  it('each rotor fires once per shaft turn; each cylinder every other crank turn', () => {
    expect(firingsPerRev(thirteenB)).toBe(2);
    expect(firingsPerRev(twentyB)).toBe(3);
    expect(firingsPerRev(sr20)).toBe(2);
    expect(firingsPerRev(twoJz)).toBe(3);
  });

  it('chamber displacement is 3·√3·R·e·B (13B, 12A)', () => {
    expect(wankelChamberDisplacementCc(105, 15, 80)).toBeCloseTo(654.7, 1);
    expect(wankelChamberDisplacementCc(105, 15, 70)).toBeCloseTo(572.9, 1);
  });
});
