import { z } from 'zod';
import { MarketSchema, RatingStandardSchema, SlugSchema, YearMonthSchema } from './common';
import { measured, sourced } from './source';

/**
 * Reference facts about how figures are published, in src/data/standards/:
 * - `power-ratings.json`: the reference atmosphere each engine rating standard
 *   corrects to, so the calibration compares every factory figure under its
 *   own standard (BUILD_PROMPT 6.5);
 * - `fuels.json`: the pump fuels factory figures were rated on, by market, and
 *   the pump fuels users choose from;
 * - `weight-bases.json`: what each market's published curb weight includes, so
 *   weights can be normalised to one basis.
 */

const Temperature = measured(['°C', 'K'], z.number());
const Pressure = measured(['kPa', 'hPa', 'mbar'], z.number().positive());

export const PowerRatingStandardSchema = z.strictObject({
  id: RatingStandardSchema.exclude(['unknown']),
  name: z.string().min(1),
  /** The documents and editions this entry stands for. */
  covers: z.string().min(1),
  referenceTemperature: Temperature,
  referencePressure: Pressure,
  /** Whether the reference pressure is total barometric or the dry-air partial pressure. */
  pressureBasis: sourced(z.enum(['total', 'dry-air'])),
  /**
   * Water vapour the simulation assumes at the reference. For a dry-air basis
   * the standard's own total minus dry pressure; for a total-pressure basis
   * the standard sets none, so this is a model assumption (marked estimated).
   */
  referenceVapourPressure: measured(['kPa', 'hPa', 'mbar'], z.number().min(0)),
  /** Correction formula for spark-ignition engines, as printed. */
  correction: sourced(z.string().min(1)).optional(),
  /** What must be fitted during the test (net: production intake, exhaust, accessories). */
  fittedEquipment: sourced(z.string().min(1)).optional(),
  /** Allowed gap between declared and measured power, as printed. */
  declaredTolerance: sourced(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
});
export type PowerRatingStandard = z.infer<typeof PowerRatingStandardSchema>;

export const PowerRatingsFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    standards: z.array(PowerRatingStandardSchema).min(1),
    /**
     * Figures whose standard the maker doesn't print (`unknown`): which
     * standard the calibration assumes, by market, and why.
     */
    unknownStandard: z.array(
      z.strictObject({
        markets: z.array(MarketSchema).min(1),
        /** Optional window on the variant's first sale month (inclusive, shared precision). */
        from: YearMonthSchema.optional(),
        to: YearMonthSchema.optional(),
        assume: RatingStandardSchema.exclude(['unknown']),
        reason: sourced(z.string().min(1)),
      }),
    ),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.standards.forEach((s, i) => {
      if (ids.has(s.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['standards', i, 'id'],
          message: `Duplicate standard "${s.id}".`,
        });
      }
      ids.add(s.id);
    });
    file.unknownStandard.forEach((u, i) => {
      if (!ids.has(u.assume)) {
        ctx.addIssue({
          code: 'custom',
          path: ['unknownStandard', i, 'assume'],
          message: `"${u.assume}" is not in \`standards\`.`,
        });
      }
    });
  });
export type PowerRatingsFile = z.infer<typeof PowerRatingsFileSchema>;

export const FuelsFileSchema = z.strictObject({
  $comment: z.string().optional(),
  /** The fuel a market's factory figures were rated on (the maker's recommended grade). */
  referenceFuels: z.array(
    z.strictObject({
      market: MarketSchema,
      grade: z.string().min(1),
      ron: sourced(z.number().min(80).max(120)),
    }),
  ),
  /** Pump fuels a user can pick (part 2a: gasoline by RON). */
  pumpFuels: z.array(
    z.strictObject({
      id: SlugSchema,
      name: z.string().min(1),
      ron: sourced(z.number().min(80).max(120)),
      notes: z.string().min(1).optional(),
    }),
  ),
});
export type FuelsFile = z.infer<typeof FuelsFileSchema>;

export const WeightBasisSchema = z.enum([
  'jis-vehicle-weight',
  'us-curb-weight',
  'din-kerb-weight',
  'eu-mass-in-running-order',
  'kerb-no-driver',
  'au-kerb-mass',
  'unstated',
]);
export type WeightBasis = z.infer<typeof WeightBasisSchema>;

export const WeightBasesFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    bases: z.array(
      z.strictObject({
        id: WeightBasisSchema,
        name: z.string().min(1),
        definition: sourced(z.string().min(1)),
        /** Is a driver (and luggage) in the figure? Left out when the basis doesn't say. */
        driverIncluded: sourced(z.boolean()).optional(),
        /** Mass the basis counts for the driver (and luggage), where it includes one. */
        driverMass: measured(['kg']).optional(),
        /** How full the fuel tank is. */
        fuelFill: sourced(z.enum(['full', '90%', 'not stated'])),
      }),
    ),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    file.bases.forEach((b, i) => {
      if (seen.has(b.id)) {
        ctx.addIssue({ code: 'custom', path: ['bases', i, 'id'], message: `Duplicate "${b.id}".` });
      }
      seen.add(b.id);
      if (b.driverIncluded?.value === true && !b.driverMass) {
        ctx.addIssue({
          code: 'custom',
          path: ['bases', i, 'driverMass'],
          message: 'A basis that includes a driver needs the driver mass it counts.',
        });
      }
    });
    for (const id of WeightBasisSchema.options) {
      if (!seen.has(id)) {
        ctx.addIssue({ code: 'custom', path: ['bases'], message: `Missing basis "${id}".` });
      }
    }
  });
export type WeightBasesFile = z.infer<typeof WeightBasesFileSchema>;
