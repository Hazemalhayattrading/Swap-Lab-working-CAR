import { z } from 'zod';
import { measured, sourced } from './source';

/** File and record ids: lowercase letters, digits, - and _. */
export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*$/, 'lowercase letters, digits, - and _ only');

/** Sales markets. Trims and engine variants differ by market (output, gearing, weight). */
export const MarketSchema = z.enum(['JDM', 'USDM', 'CDM', 'EUDM', 'UKDM', 'AUDM', 'NZDM', 'other']);
export type Market = z.infer<typeof MarketSchema>;

/** `1999-01` or `1999`. Months matter: many JDM changes happened mid-year. */
export const YearMonthSchema = z
  .string()
  .regex(/^(19|20)\d{2}(-(0[1-9]|1[0-2]))?$/, 'YYYY or YYYY-MM');

/**
 * A production or sales window. `to` is left out while still in production.
 * The two ends are compared at the precision both share, so `1995-04` to `1995`
 * (a source that gives only the end year) is a valid window.
 */
export const PeriodSchema = z
  .strictObject({ from: YearMonthSchema, to: YearMonthSchema.optional() })
  .refine(
    (p) => p.to === undefined || p.from.slice(0, p.to.length) <= p.to.slice(0, p.from.length),
    {
      message: '`from` is after `to`.',
      path: ['to'],
    },
  );
export type Period = z.infer<typeof PeriodSchema>;

export const SourcedPeriodSchema = sourced(PeriodSchema);

/** Units a data file may use, per quantity. The loader converts them to SI. */
export const UNITS = {
  power: ['PS', 'hp', 'kW'],
  torque: ['Nm', 'kgf·m', 'lb-ft'],
  mass: ['kg', 'lb'],
  length: ['mm', 'in'],
  displacement: ['cc'],
  pressure: ['bar', 'kPa', 'psi', 'kgf/cm²'],
  speed: ['rpm'],
  roadSpeed: ['km/h', 'mph'],
  flow: ['cc/min'],
  angle: ['deg'],
  volume: ['L'],
  time: ['s'],
} as const;

/**
 * Currencies a price may be printed in. Kept out of UNITS: money has no SI
 * conversion, and turning AUD or JPY into USD needs a dated exchange rate,
 * which is Phase 3's job (USD to SAR is the 3.75 peg).
 */
export const CURRENCIES = ['USD', 'AUD', 'JPY', 'GBP', 'EUR', 'SAR'] as const;

/** A price as the seller lists it; the source's access date is its date stamp. */
export const Price = measured(CURRENCIES);

export const Power = measured(UNITS.power);
export const Torque = measured(UNITS.torque);
export const Mass = measured(UNITS.mass);
export const Length = measured(UNITS.length);
export const Rpm = measured(UNITS.speed);

/** A plain ratio (gear, final drive, compression): no unit. */
export const Ratio = sourced(z.number().positive());

/**
 * How a power or torque figure was rated. The same engine reads differently
 * under JIS net, SAE net, DIN and EEC, so the standard travels with the number.
 */
export const RatingStandardSchema = z.enum([
  'JIS-net',
  'SAE-net',
  'DIN-70020',
  'EEC-80/1269',
  'ADR',
  'unknown',
]);
