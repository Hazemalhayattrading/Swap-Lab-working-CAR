import { z } from 'zod';
import { MODEL_CONSTANT_IDS } from '../sim-data';
import { checkConfidence, ConfidenceSchema, SourceSchema } from './source';

/**
 * The numbers the simulation itself assumes (src/data/model/assumptions.json):
 * gas and fuel properties, efficiencies, friction and knock sensitivities,
 * drivetrain losses, and the shape priors it uses where a maker publishes only
 * peak figures. They are not car data, but they decide every simulated
 * number, so they carry sources and confidence like everything else
 * (CLAUDE.md rule 2) and the "How we calculate this" drawer lists them.
 *
 * - `physics`: a physical property (gas constant, heat capacity).
 * - `literature`: a value taken from published engineering sources.
 * - `model-choice`: our own modelling assumption, marked `estimated` with the
 *   reasoning in `method`.
 */

/** Units an assumption may be written in, and the factor to the SI value the model uses. */
export const MODEL_UNITS = {
  'J/(kg·K)': 1,
  'MJ/kg': 1e6,
  'kg/m³': 1,
  ratio: 1,
  kPa: 1000,
  'kPa/(m/s)': 1000,
  'kPa/(m/s)²': 1000,
  'kPa/krpm': 1000,
  'kPa/krpm²': 1000,
  deg: 1,
  'deg/ON': 1,
  'ON/K': 1,
  'ON/kPa': 1,
  '1/deg²': 1,
  rpm: 1,
  '%': 0.01,
  '%/K': 0.01,
  '%/ON': 0.01,
} as const;
export type ModelUnit = keyof typeof MODEL_UNITS;

export const AssumptionSchema = z
  .strictObject({
    id: z.enum(MODEL_CONSTANT_IDS),
    /** What it is, in plain words, for the drawer. */
    label: z.string().min(1),
    kind: z.enum(['physics', 'literature', 'model-choice']),
    value: z.number(),
    unit: z.enum(Object.keys(MODEL_UNITS) as [ModelUnit, ...ModelUnit[]]),
    confidence: ConfidenceSchema,
    sources: z.array(SourceSchema),
    method: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  })
  .superRefine(checkConfidence)
  .refine((a) => a.kind !== 'model-choice' || a.confidence === 'estimated', {
    message: 'A model choice is our own assumption, so it must be marked `estimated`.',
    path: ['confidence'],
  });
export type Assumption = z.infer<typeof AssumptionSchema>;

export const AssumptionsFileSchema = z
  .strictObject({
    $comment: z.string().optional(),
    assumptions: z.array(AssumptionSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    file.assumptions.forEach((a, i) => {
      if (seen.has(a.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['assumptions', i, 'id'],
          message: `Duplicate assumption "${a.id}".`,
        });
      }
      seen.add(a.id);
    });
    for (const id of MODEL_CONSTANT_IDS) {
      if (!seen.has(id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['assumptions'],
          message: `Missing assumption "${id}" (the simulation needs every id in MODEL_CONSTANT_IDS).`,
        });
      }
    }
  });
export type AssumptionsFile = z.infer<typeof AssumptionsFileSchema>;
