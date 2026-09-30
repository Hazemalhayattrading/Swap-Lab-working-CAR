import { z } from 'zod';
import { UNITS } from '../unit-list';
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

/** Where a fuel can be bought in Saudi Arabia, the site's home market. */
export const FuelAvailabilitySchema = z.enum([
  /** At the pump across the country. */
  'pump-nationwide',
  /** At the pump, but only at some stations or in some cities. */
  'pump-some-stations',
  /** Sold in drums or cans by a distributor, or at a circuit. */
  'drum',
  /** Not sold in the country as far as the sources show. */
  'not-sold',
]);

/**
 * A fuel the user can pick. Gasoline grades take the model's gasoline
 * properties (model/assumptions.json) unless they carry their own; E85 and
 * race fuels carry theirs, each sourced.
 */
export const FuelChoiceSchema = z
  .strictObject({
    id: SlugSchema,
    name: z.string().min(1),
    kind: z.enum(['pump-gasoline', 'race-gasoline', 'e85']),
    ron: sourced(z.number().min(80).max(120)),
    lhv: measured(UNITS.energyDensity).optional(),
    stoichAfr: sourced(z.number().min(5).max(16)).optional(),
    density: measured(UNITS.density).optional(),
    /** Latent heat of vaporisation: how much a fuel cools the charge as it evaporates. */
    heatOfVaporisation: measured(UNITS.latentHeat).optional(),
    /** Share of ethanol by volume (E85 is sold as a range). */
    ethanolShare: sourced(z.number().min(0).max(1)).optional(),
    /**
     * A stock ECU can't run it: E85 needs about 40 % more fuel flow and a
     * tune. The model then assumes an ECU tuned for it.
     */
    needsTune: z.boolean(),
    availability: z.strictObject({
      status: FuelAvailabilitySchema,
      /** One line for the dyno sheet, e.g. "At Aramco stations in Riyadh, Jeddah and Dammam". */
      summary: sourced(z.string().min(1)),
    }),
    notes: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    if (f.kind !== 'pump-gasoline') {
      for (const key of ['lhv', 'stoichAfr', 'density', 'heatOfVaporisation'] as const) {
        if (f[key] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `A ${f.kind} fuel needs its own ${key} (gasoline grades use the model's).`,
          });
        }
      }
    }
    if (f.kind === 'e85' && !f.needsTune) {
      ctx.addIssue({
        code: 'custom',
        path: ['needsTune'],
        message: 'E85 always needs a tune: a stock ECU runs it lean.',
      });
    }
  });
export type FuelChoice = z.infer<typeof FuelChoiceSchema>;

export const FuelsFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    /** The fuel a market's factory figures were rated on (the maker's recommended grade). */
    referenceFuels: z.array(
      z.strictObject({
        market: MarketSchema,
        grade: z.string().min(1),
        ron: sourced(z.number().min(80).max(120)),
      }),
    ),
    /** Fuels a user can pick: Saudi pump grades, race fuel and E85. */
    fuels: z.array(FuelChoiceSchema).min(1),
    /** The fuel the site starts on (CLAUDE.md: 95 RON). */
    defaultFuel: SlugSchema,
  })
  .superRefine((file, ctx) => {
    const ids = file.fuels.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['fuels'], message: 'Fuel ids must be unique.' });
    }
    if (!ids.includes(file.defaultFuel)) {
      ctx.addIssue({
        code: 'custom',
        path: ['defaultFuel'],
        message: `"${file.defaultFuel}" is not in \`fuels\`.`,
      });
    }
  });
export type FuelsFile = z.infer<typeof FuelsFileSchema>;

/**
 * Altitude presets (owner's decision, 2026-09-30): Jeddah at sea level and
 * Riyadh at about 600 m, plus a custom elevation. Pressure at an elevation
 * comes from the International Standard Atmosphere, whose formula and
 * sea-level values are recorded here with their source.
 */
export const LocationsFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    standardAtmosphere: z.strictObject({
      seaLevelPressure: measured(['kPa', 'hPa']),
      seaLevelTemperature: measured(['°C', 'K']),
      /** Temperature lapse rate in the troposphere, K per m. */
      lapseRate: sourced(z.number().positive()),
      /** The formula's exponent, g0 M / (R* L). */
      exponent: sourced(z.number().positive()),
      formula: sourced(z.string().min(1)),
    }),
    locations: z
      .array(
        z.strictObject({
          id: SlugSchema,
          name: z.string().min(1),
          /** Where the preset stands for, e.g. "sea level" or "about 600 m". */
          label: z.string().min(1),
          elevation: measured(UNITS.elevation, z.number().min(-500).max(5000)),
          /** Mean summer station pressure, where a climate record gives one (shown, not used). */
          summerStationPressure: measured(['hPa', 'kPa']).optional(),
          notes: z.string().min(1).optional(),
        }),
      )
      .min(1),
    defaultLocation: SlugSchema,
  })
  .superRefine((file, ctx) => {
    if (!file.locations.some((l) => l.id === file.defaultLocation)) {
      ctx.addIssue({
        code: 'custom',
        path: ['defaultLocation'],
        message: `"${file.defaultLocation}" is not in \`locations\`.`,
      });
    }
  });
export type LocationsFile = z.infer<typeof LocationsFileSchema>;

/** Chassis dynamometers a known build can be measured on. */
export const DYNO_IDS = [
  'dynojet',
  'mustang',
  'dynapack',
  'dyno-dynamics',
  'mainline',
  'superflow',
  'rototest',
] as const;
export const DynoIdSchema = z.enum(DYNO_IDS);

/** How a chassis dyno corrects its reading to reference air, as its software offers. */
export const CORRECTION_IDS = [
  'sae-j1349',
  'sae-j607-std',
  'din-70020',
  'eec-80-1269',
  'uncorrected',
] as const;
export const CorrectionIdSchema = z.enum(CORRECTION_IDS);

/**
 * Different dynos read the same car differently, and each sheet is corrected
 * to its own reference air (BUILD_PROMPT 6.5: normalise for both before a
 * known build is compared with the model).
 */
export const DynosFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    dynos: z.array(
      z.strictObject({
        id: DynoIdSchema,
        name: z.string().min(1),
        kind: z.enum(['inertia-roller', 'load-roller', 'hub']),
        /**
         * What this dyno reads for a car a Dynojet reads 1.00 on (same car, same
         * correction). The model's wheel power is a Dynojet-type reading.
         */
        readingFactor: sourced(z.number().min(0.6).max(1.3)),
        /** The correction its software applies unless the operator picks another. */
        defaultCorrection: sourced(CorrectionIdSchema),
        notes: z.string().min(1).optional(),
      }),
    ),
    corrections: z.array(
      z.strictObject({
        id: CorrectionIdSchema,
        name: z.string().min(1),
        /** Reference air; left out for `uncorrected`. */
        referenceTemperature: measured(['°C', 'K', '°F']).optional(),
        referencePressure: measured(['kPa', 'hPa', 'mbar', 'inHg']).optional(),
        pressureBasis: sourced(z.enum(['dry-air', 'total'])).optional(),
        /**
         * cf = scale x (pRef / p)^pressureExponent x (T / TRef)^temperatureExponent - offset,
         * as the dyno software applies it to the measured power.
         */
        scale: sourced(z.number().positive()).optional(),
        offset: sourced(z.number().min(0)).optional(),
        pressureExponent: sourced(z.number().positive()).optional(),
        temperatureExponent: sourced(z.number().positive()).optional(),
        formula: sourced(z.string().min(1)),
      }),
    ),
  })
  .superRefine((file, ctx) => {
    for (const id of DYNO_IDS) {
      if (!file.dynos.some((d) => d.id === id)) {
        ctx.addIssue({ code: 'custom', path: ['dynos'], message: `Missing dyno "${id}".` });
      }
    }
    file.corrections.forEach((c, i) => {
      const parts = [
        c.referenceTemperature,
        c.referencePressure,
        c.pressureBasis,
        c.scale,
        c.offset,
        c.pressureExponent,
        c.temperatureExponent,
      ];
      const set = parts.filter((x) => x !== undefined).length;
      if (c.id === 'uncorrected' ? set !== 0 : set !== parts.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['corrections', i],
          message:
            c.id === 'uncorrected'
              ? 'An uncorrected reading has no reference air or formula terms.'
              : 'A correction needs its reference air, pressure basis and every formula term.',
        });
      }
    });
    for (const id of CORRECTION_IDS) {
      if (!file.corrections.some((c) => c.id === id)) {
        ctx.addIssue({ code: 'custom', path: ['corrections'], message: `Missing "${id}".` });
      }
    }
  });
export type DynosFile = z.infer<typeof DynosFileSchema>;

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
