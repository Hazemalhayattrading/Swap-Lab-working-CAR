import { z } from 'zod';
import { sourced } from './source';
import {
  Length,
  Mass,
  MarketSchema,
  Power,
  RatingStandardSchema,
  Ratio,
  Rpm,
  SlugSchema,
  SourcedPeriodSchema,
  Torque,
  UNITS,
} from './common';
import { measured } from './source';

/**
 * Engine data (BUILD_PROMPT section 7.1): one file per engine in src/data/engines/.
 *
 * Hardware shared by every version of an engine sits at the top level. What
 * differs by year or market (compression, turbos, injectors, cams, rated
 * output) sits in `variants`, and each car trim points at one variant.
 *
 * What's deliberately not here: a volumetric-efficiency curve. The build
 * prompt's VE curve is a model parameter, fitted in Phase 2 against the rated
 * output recorded here. Storing a made-up curve now would be invented data.
 */

const Output = z.strictObject({
  power: Power,
  powerRpm: Rpm,
  torque: Torque,
  torqueRpm: Rpm,
  standard: RatingStandardSchema,
});

const Turbo = z.strictObject({
  /** Maker and model as published, e.g. "Hitachi HT18" or "Toyota CT12B". */
  model: sourced(z.string().min(1)),
  count: z.number().int().min(1).max(4),
  /** Compressor wheel material or any other detail that changes the swap story. */
  notes: z.string().min(1).optional(),
});

const Cams = z.strictObject({
  intakeDuration: measured(UNITS.angle).optional(),
  exhaustDuration: measured(UNITS.angle).optional(),
  intakeLift: Length.optional(),
  exhaustLift: Length.optional(),
});

export const EngineVariantSchema = z.strictObject({
  id: SlugSchema,
  name: z.string().min(1),
  markets: z.array(MarketSchema).min(1),
  period: SourcedPeriodSchema,
  /** Chassis codes it came in, descriptive only (e.g. "S15", "JZA80"). */
  fittedTo: z.array(z.string().min(1)).min(1),
  compressionRatio: Ratio,
  induction: sourced(
    z.enum(['naturally-aspirated', 'single-turbo', 'twin-turbo-sequential', 'twin-turbo-parallel']),
  ),
  turbos: z.array(Turbo).optional(),
  /** Stock peak boost. */
  boost: measured(UNITS.pressure).optional(),
  intercooler: sourced(z.enum(['none', 'air-to-air-front', 'air-to-air-side', 'air-to-water'])),
  injectorFlow: measured(UNITS.flow).optional(),
  cams: Cams.optional(),
  variableValveTiming: sourced(z.enum(['none', 'intake-on-off', 'intake-continuous'])),
  output: Output,
  /** Tachometer redline. */
  redline: Rpm.optional(),
  /** Fuel-cut rev limit, where the factory figure is published. */
  revLimit: Rpm.optional(),
  ecu: sourced(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
});
export type EngineVariant = z.infer<typeof EngineVariantSchema>;

/** A published "the stock part holds about this much" figure, with its context. */
const ReportedLimit = z.strictObject({
  component: z.enum(['bottom-end', 'rods', 'pistons', 'head-gasket', 'crank', 'oil-pump', 'block']),
  quantity: z.enum(['crank-power', 'wheel-power', 'torque', 'rpm']),
  value: measured([...UNITS.power, ...UNITS.torque, ...UNITS.speed]),
  /** Conditions: fuel, rev limit, tune quality, how long it lasted. */
  context: z.string().min(1),
});

export const EngineSchema = z
  .strictObject({
    $comment: z.string().optional(),
    id: SlugSchema,
    code: z.string().min(1),
    manufacturer: z.string().min(1),
    family: z.string().min(1),
    /**
     * `launch-swap`: one of the 12 swap engines in BUILD_PROMPT section 3; the
     * swap-relevant hardware (weight, size, bellhousing, sump, internals) is required.
     * `stock-only`: powers a stock trim but isn't offered as a swap, so only the
     * core specs are required.
     */
    role: z.enum(['launch-swap', 'stock-only']),
    layout: z.enum(['inline', 'V', 'flat', 'rotary']),
    /** Cylinders, or rotors for a rotary. */
    cylinders: z.number().int().min(1).max(16),
    displacement: measured(UNITS.displacement),
    bore: Length,
    stroke: Length,
    camLayout: sourced(z.enum(['DOHC', 'SOHC', 'OHV'])),
    valvesPerCylinder: sourced(z.number().int().min(2).max(5)),
    camDrive: sourced(z.enum(['belt', 'chain', 'gear'])),
    blockMaterial: sourced(z.enum(['cast-iron', 'aluminium'])),
    headMaterial: sourced(z.enum(['cast-iron', 'aluminium'])),
    /** Cylinder numbers in firing order, e.g. [1, 5, 3, 6, 2, 4]. */
    firingOrder: sourced(z.array(z.number().int().min(1)).min(1)),
    fuelInjection: sourced(z.enum(['port', 'direct', 'carburettor'])),
    dryWeight: Mass.optional(),
    dimensions: z.strictObject({ length: Length, width: Length, height: Length }).optional(),
    /** Gearbox bolt pattern, as a shared id, e.g. "nissan-sr20" or "toyota-jz". */
    bellhousing: sourced(SlugSchema).optional(),
    sump: sourced(z.enum(['front', 'centre', 'rear'])).optional(),
    oilCapacity: measured(UNITS.volume).optional(),
    internals: z
      .strictObject({
        crank: sourced(z.enum(['forged', 'cast'])),
        rods: sourced(z.enum(['forged', 'cast', 'powdered-metal'])),
        pistons: sourced(z.enum(['cast', 'hypereutectic', 'forged'])),
        reportedLimits: z.array(ReportedLimit),
      })
      .optional(),
    variants: z.array(EngineVariantSchema).min(1),
  })
  .superRefine((engine, ctx) => {
    const order = engine.firingOrder.value;
    const expected = Array.from({ length: engine.cylinders }, (_, i) => i + 1);
    if (engine.layout !== 'rotary' && [...order].sort((a, b) => a - b).join() !== expected.join()) {
      ctx.addIssue({
        code: 'custom',
        path: ['firingOrder', 'value'],
        message: `Firing order must list cylinders 1-${engine.cylinders} once each.`,
      });
    }
    if (engine.role === 'launch-swap') {
      for (const key of ['dryWeight', 'dimensions', 'bellhousing', 'sump', 'internals'] as const) {
        if (engine[key] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `Launch-swap engines need \`${key}\` (mark it estimated with a method if no source exists).`,
          });
        }
      }
    }
    const seen = new Set<string>();
    engine.variants.forEach((v, i) => {
      if (seen.has(v.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'id'],
          message: `Duplicate variant id "${v.id}".`,
        });
      }
      seen.add(v.id);
      const turbo = v.induction.value !== 'naturally-aspirated';
      if (turbo && !v.turbos?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'turbos'],
          message: 'A turbo variant needs its turbos listed.',
        });
      }
      if (!turbo && (v.turbos?.length || v.boost)) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i],
          message: 'A naturally aspirated variant cannot have turbos or boost.',
        });
      }
    });
  });
export type Engine = z.infer<typeof EngineSchema>;
