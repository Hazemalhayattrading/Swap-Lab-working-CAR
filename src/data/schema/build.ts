import { z } from 'zod';
import { MIN_KNOWN_BUILDS_PER_CAR } from '../sim-data';
import { UNITS } from '../unit-list';
import { Power, Rpm, SlugSchema, Torque, YearMonthSchema } from './common';
import { SourceSchema, measured, sourced } from './source';
import { CorrectionIdSchema, DynoIdSchema } from './standards';

/**
 * Known real builds (BUILD_PROMPT 6.5): documented cars with a published
 * chassis-dyno result, one file per car in src/data/builds/<car-id>.json.
 * tests/calibration/known-builds.test.ts runs each one through the model and
 * fails CI if any lands more than 10 % off its peak wheel power, after the
 * sheet is normalised for its dyno and its correction standard.
 *
 * What a build may change is what the model can represent: boost, a turbo
 * with a published compressor map, a supercharger kit, the intercooler,
 * intake and exhaust restriction, the fuel, the injectors and an ECU tune.
 * Builds whose power comes from parts it can't (camshafts, porting, displacement,
 * another engine's ECU program) are kept out; the research notes say which.
 */

const AirTemperature = measured(['°C', '°F']);
const AirPressure = measured(['kPa', 'hPa', 'mbar', 'inHg', 'psi']);
const Pressure = measured(UNITS.pressure);

/**
 * An aftermarket turbo, as its maker publishes its compressor map. Where no
 * map is published, the maker's or seller's maximum flow stands in for the
 * choke flow, and peak efficiency and top pressure ratio fall back to the
 * model's defaults (model/assumptions.json); the build's notes say so.
 */
const TurboSpec = z.strictObject({
  model: sourced(z.string().min(1)),
  count: z.number().int().min(1).max(2),
  /** Corrected mass flow at the choke line at the top of the map, per turbo. */
  compressorMaxFlow: measured(UNITS.massFlow),
  /** The inlet conditions the map's flow is corrected to (makers differ), where stated. */
  mapReferenceTemperature: measured(['°C', '°F', 'K']).optional(),
  mapReferencePressure: measured(['kPa', 'psi', 'inHg', 'bar']).optional(),
  peakEfficiency: sourced(z.number().min(0.55).max(0.85)).optional(),
  maxPressureRatio: sourced(z.number().min(1.5).max(6)).optional(),
});

/** A supercharger kit on a naturally aspirated engine. */
const SuperchargerSpec = z.strictObject({
  model: sourced(z.string().min(1)),
  kind: z.enum(['centrifugal', 'twin-screw', 'roots']),
  /** Boost the kit makes at `boostRpm`, as the build documents it. */
  boost: Pressure,
  boostRpm: Rpm,
  intercooled: sourced(z.boolean()),
  peakEfficiency: sourced(z.number().min(0.55).max(0.85)).optional(),
  compressorMaxFlow: measured(UNITS.massFlow).optional(),
  mapReferenceTemperature: measured(['°C', '°F', 'K']).optional(),
  mapReferencePressure: measured(['kPa', 'psi', 'inHg', 'bar']).optional(),
  maxPressureRatio: sourced(z.number().min(1.2).max(4)).optional(),
});

/** The fuel on the dyno day: gasoline by octane, race fuel, or E85. */
const BuildFuel = z.strictObject({
  kind: z.enum(['pump-gasoline', 'race-gasoline', 'e85']),
  /** RON; a US pump octane (AKI) is converted, marked estimated. */
  ron: sourced(z.number().min(80).max(120)),
  /** A fuel from standards/fuels.json whose properties apply (race fuel, E85). */
  fuelId: SlugSchema.optional(),
});

const Modifications = z.strictObject({
  /** Boost as documented (gauge): the peak, and where it is printed, at peak power. */
  boost: z
    .strictObject({
      peak: Pressure,
      atPeakPower: Pressure.optional(),
      /** rpm where full boost arrives, read off the sheet. */
      fullBoostRpm: Rpm.optional(),
    })
    .optional(),
  /** Left out when the factory turbo(s) stay. */
  turbo: TurboSpec.optional(),
  supercharger: SuperchargerSpec.optional(),
  /** `aftermarket`: a bigger air-to-air core, front-mount or in the stock place. */
  intercooler: sourced(z.enum(['stock', 'aftermarket'])),
  /**
   * `cat-back`: silencers and pipes after the catalyst only. `full`: headers on a
   * naturally aspirated engine, or a downpipe on a turbo, plus the rest of the
   * exhaust, with or without a catalyst.
   */
  exhaust: sourced(z.enum(['stock', 'cat-back', 'full'])),
  /** `free-flow`: a cone filter, open intake or larger air box. */
  intake: sourced(z.enum(['stock', 'free-flow'])),
  /** `tuned`: reflash, piggyback or standalone set up on a dyno for these parts and this fuel. */
  ecu: sourced(z.enum(['stock', 'tuned'])),
  fuel: BuildFuel,
  /** Per injector, where the build changed them; `unstated` for bigger ones of unknown size. */
  injectors: z.union([measured(UNITS.flow), sourced(z.literal('unstated'))]).optional(),
  /** Staged fuelling (13B-REW): the secondary injectors, where the build changed them. */
  secondaryInjectors: measured(UNITS.flow).optional(),
  camshafts: sourced(z.literal('stock')),
  /** The parts list as the source gives it, for people. */
  described: z.string().min(1),
});

const Result = z.strictObject({
  wheelPower: Power,
  powerRpm: Rpm.optional(),
  wheelTorque: Torque.optional(),
  dyno: sourced(DynoIdSchema),
  /** As printed, e.g. "Dynojet 224xLC". */
  dynoModel: z.string().min(1).optional(),
  /** `not-stated`: the sheet doesn't say; the dyno's default correction is assumed. */
  correction: sourced(z.union([CorrectionIdSchema, z.literal('not-stated')])),
  /** Test-day air, where the sheet prints it. */
  conditions: z
    .strictObject({
      temperature: AirTemperature,
      pressure: AirPressure.optional(),
      /** Elevation of the dyno, where the source gives it instead of a pressure. */
      elevation: measured(UNITS.elevation).optional(),
      relativeHumidity: sourced(z.number().min(0).max(1)).optional(),
    })
    .optional(),
  gear: sourced(z.number().int().min(1).max(8)).optional(),
});

/**
 * How a build's score relates to the model's fitted constants (the owner,
 * 2026-09-30). `fit`: one of the builds that chose the constants fitted on
 * `fitted`, so its score is in-sample. `holdout`: added after that, and scored
 * before any constant was refitted; `firstScore` keeps that out-of-sample
 * result, and the calibration report shows it next to the current score.
 */
const Scoring = z.discriminatedUnion('sample', [
  z.strictObject({ sample: z.literal('fit'), fitted: z.iso.date() }),
  z.strictObject({
    sample: z.literal('holdout'),
    firstScore: z.strictObject({
      /** (model - sheet) / sheet, on peak wheel power, as first scored. */
      error: z.number().min(-1).max(1),
      scored: z.iso.date(),
      /** The commit the model was at when the build was first scored. */
      commit: z.string().regex(/^[0-9a-f]{7,40}$/),
    }),
  }),
]);

/**
 * The owner's exception to the three-build rule for one car, where no third
 * build meets the inclusion rules yet: this car needs `minBuilds`, every other
 * car still needs three. `badge` is what the car's stock-check sticker says
 * about the gap. It comes out once the car has three counted builds (the
 * calibration test fails while an exception is no longer needed).
 */
const BuildCountException = z.strictObject({
  minBuilds: z
    .number()
    .int()
    .min(1)
    .max(MIN_KNOWN_BUILDS_PER_CAR - 1),
  reason: z.string().min(20),
  decided: z.iso.date(),
  approvedBy: z.literal('owner'),
  badge: z.string().min(1),
});

export const KnownBuildSchema = z.strictObject({
  id: SlugSchema,
  /** Plain title, e.g. "Spec-R on the stock T28 at 1.0 bar, front-mount cooler". */
  title: z.string().min(1),
  /** The trim in the car file it started as (market, gearbox). */
  trim: SlugSchema,
  who: z.string().min(1),
  /** When it was on the dyno, where the source says (a post date is noted as such). */
  date: YearMonthSchema.or(z.iso.date()).optional(),
  modifications: Modifications,
  result: Result,
  /** The page a person can check it on: the dyno sheet or the build thread. */
  sources: z.array(SourceSchema).min(1),
  notes: z.string().min(1).optional(),
  /**
   * Kept on file, and still shown with its result, but out of the 10 % gate:
   * the sheet fails one of the inclusion rules (docs/research/part2b), for
   * example figures that contradict each other. The reason says which, and
   * when it was decided. Only builds without one count toward a car's three.
   */
  excluded: z.strictObject({ reason: z.string().min(1), decided: z.iso.date() }).optional(),
  scoring: Scoring,
});
export type KnownBuild = z.infer<typeof KnownBuildSchema>;

export const KnownBuildsFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    car: SlugSchema,
    buildCountException: BuildCountException.optional(),
    builds: z.array(KnownBuildSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = file.builds.map((b) => b.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['builds'], message: 'Build ids must be unique.' });
    }
    const counted = file.builds.filter((b) => !b.excluded).length;
    const needed = file.buildCountException?.minBuilds ?? MIN_KNOWN_BUILDS_PER_CAR;
    if (counted < needed) {
      ctx.addIssue({
        code: 'custom',
        path: ['builds'],
        message: `${String(counted)} counted builds; the car needs ${String(needed)}.`,
      });
    }
    file.builds.forEach((b, i) => {
      const m = b.modifications;
      if (m.turbo && m.supercharger) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', i, 'modifications'],
          message: 'A build has a turbo or a supercharger, not both.',
        });
      }
      if (m.turbo && m.boost === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', i, 'modifications', 'boost'],
          message: 'A new turbo needs the boost it ran at.',
        });
      }
      if (m.fuel.kind !== 'pump-gasoline' && m.fuel.fuelId === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', i, 'modifications', 'fuel', 'fuelId'],
          message: 'Race fuel and E85 name the fuel whose properties apply.',
        });
      }
      const c = b.result.conditions;
      if (c && c.pressure === undefined && c.elevation === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', i, 'result', 'conditions'],
          message: 'Test-day air needs a pressure or the dyno’s elevation.',
        });
      }
    });
  });
export type KnownBuildsFile = z.infer<typeof KnownBuildsFileSchema>;
