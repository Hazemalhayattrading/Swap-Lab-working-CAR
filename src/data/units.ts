import { UNITS } from './schema/common';

/**
 * Converts values as printed by a source (see `measured()` in schema/source.ts)
 * into SI for the simulation (CLAUDE.md conventions: SI internally).
 *
 * Targets: W, N·m, kg, m, m³, Pa (gauge, as boost is quoted), m/s, m³/s, rad, s.
 * Engine speed stays in rpm: the sim steps in rpm and every source quotes it that way.
 */

type Unit = (typeof UNITS)[keyof typeof UNITS][number];

/** Exact factors to SI. PS is the metric horsepower (DIN 66036); hp is mechanical (SAE). */
export const TO_SI: Readonly<Record<Unit, number>> = {
  PS: 735.49875,
  hp: 745.69987158227,
  kW: 1000,
  Nm: 1,
  'kgf·m': 9.80665,
  'lb-ft': 1.3558179483314,
  kg: 1,
  lb: 0.45359237,
  mm: 0.001,
  in: 0.0254,
  cc: 1e-6,
  bar: 1e5,
  kPa: 1000,
  psi: 6894.757293168,
  'kgf/cm²': 98066.5,
  rpm: 1,
  'km/h': 1 / 3.6,
  mph: 0.44704,
  'cc/min': 1e-6 / 60,
  deg: Math.PI / 180,
  L: 0.001,
  s: 1,
};

export function toSI(value: number, unit: Unit): number {
  return value * TO_SI[unit];
}

function quantityOf(unit: Unit): string {
  const entry = Object.entries(UNITS).find(([, units]) =>
    (units as readonly string[]).includes(unit),
  );
  if (!entry) throw new Error(`Unknown unit "${unit}".`);
  return entry[0];
}

/** Converts between two units of the same quantity, e.g. PS to kW for display. */
export function convert(value: number, from: Unit, to: Unit): number {
  if (quantityOf(from) !== quantityOf(to)) {
    throw new Error(`Can't convert ${from} (${quantityOf(from)}) to ${to} (${quantityOf(to)}).`);
  }
  return (value * TO_SI[from]) / TO_SI[to];
}
