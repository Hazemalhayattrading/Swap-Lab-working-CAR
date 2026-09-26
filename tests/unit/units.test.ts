import { describe, expect, it } from 'vitest';
import { convert, toSI } from '../../src/data/units';

describe('unit conversion', () => {
  it('converts published power ratings', () => {
    expect(convert(280, 'PS', 'kW')).toBeCloseTo(205.94, 2);
    expect(convert(320, 'hp', 'kW')).toBeCloseTo(238.62, 2);
    expect(convert(250, 'PS', 'hp')).toBeCloseTo(246.58, 2);
  });

  it('converts torque, including kgf·m from JDM spec sheets', () => {
    expect(convert(28.0, 'kgf·m', 'Nm')).toBeCloseTo(274.59, 2);
    expect(convert(315, 'lb-ft', 'Nm')).toBeCloseTo(427.08, 2);
  });

  it('converts to SI base units', () => {
    expect(toSI(1998, 'cc')).toBeCloseTo(0.001998, 9);
    expect(toSI(1, 'bar')).toBe(100_000);
    expect(toSI(3600, 'lb')).toBeCloseTo(1632.93, 2);
    expect(toSI(180, 'km/h')).toBeCloseTo(50, 9);
    expect(toSI(6000, 'rpm')).toBe(6000);
  });

  it('refuses to convert between different quantities', () => {
    expect(() => convert(1, 'PS', 'Nm')).toThrow(/Can't convert/);
  });
});
