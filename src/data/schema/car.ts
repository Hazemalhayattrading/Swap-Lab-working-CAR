import { z } from 'zod';
import { measured, sourced } from './source';
import {
  Length,
  Mass,
  MarketSchema,
  Ratio,
  SlugSchema,
  SourcedPeriodSchema,
  UNITS,
} from './common';

/**
 * Car data (BUILD_PROMPT section 7.1): one file per chassis in src/data/cars/.
 *
 * Trims are year x market x grade x gearbox, because those change output,
 * gearing and weight. Each trim points at an engine variant in
 * src/data/engines/, and at one of the car's gearboxes.
 */

export const MOUNT_POINTS = [
  'mount_engine',
  'mount_trans',
  'mount_intake',
  'mount_turbo',
  'mount_supercharger',
  'mount_exhaust',
  'mount_radiator',
  'mount_intercooler',
  'mount_oilcooler',
  'mount_seat_driver',
  'mount_seat_passenger',
  'mount_wheel_fl',
  'mount_wheel_fr',
  'mount_wheel_rl',
  'mount_wheel_rr',
  'mount_aero_front',
  'mount_aero_side',
  'mount_aero_rear',
  'mount_aero_wing',
] as const;
export const MountPointNameSchema = z.enum(MOUNT_POINTS);

/** ISO metric tyre size, e.g. 225/45R17 or 235/45ZR17. */
const TyreSize = z.string().regex(/^\d{3}\/\d{2}Z?R\d{2}$/, 'tyre size like 225/45R17');
/** Wheel size, e.g. 17x7.5JJ +30 or 17x8J. Offset is optional. */
const WheelSize = z
  .string()
  .regex(/^\d{2}x\d{1,2}(\.\d)?J{1,2}( [+-]\d{1,2})?$/, 'wheel like 17x7.5JJ +30');

export const TransmissionSchema = z
  .strictObject({
    id: SlugSchema,
    name: z.string().min(1),
    /**
     * `automated-manual`: a manual gearbox with computer-controlled clutch and
     * shifts and no torque converter (BMW SMG / SMG II).
     */
    type: z.enum(['manual', 'automatic', 'automated-manual']),
    gears: z.number().int().min(3).max(8),
    /** Factory code, e.g. "V160" or "A340E". */
    code: sourced(z.string().min(1)).optional(),
    /** Forward ratios, first gear first. */
    ratios: sourced(z.array(z.number().positive()).min(3)),
    reverse: Ratio.optional(),
  })
  .refine((t) => t.ratios.value.length === t.gears, {
    message: 'Number of ratios must match `gears`.',
    path: ['ratios', 'value'],
  });
export type Transmission = z.infer<typeof TransmissionSchema>;

const Dimensions = z.strictObject({
  length: Length,
  width: Length,
  height: Length,
  wheelbase: Length,
  trackFront: Length,
  trackRear: Length,
});

/** Published acceleration tests, for the Phase 2 chassis calibration. */
const PerformanceTest = z.strictObject({
  metric: z.enum(['0-100 km/h', '0-60 mph', 'quarter-mile', '0-400 m']),
  time: measured(UNITS.time),
  /** Who ran it: "Car and Driver road test" or "manufacturer claim". */
  by: z.string().min(1),
});

export const TrimSchema = z.strictObject({
  id: SlugSchema,
  /** Grade name as sold, e.g. "Spec-R" or "RZ". */
  name: z.string().min(1),
  market: MarketSchema,
  period: SourcedPeriodSchema,
  bodyStyle: z.enum(['coupe', 'liftback', 'convertible', 'targa', 'sedan', 'hatchback', 'wagon']),
  engine: z.strictObject({ id: SlugSchema, variant: SlugSchema }),
  transmission: SlugSchema,
  finalDrive: Ratio,
  /**
   * `clutch-lsd` locks in proportion to torque (ramps and preload);
   * `speed-sensing-clutch-lsd` locks in proportion to the wheel-speed difference,
   * via a clutch pack pressed by a viscous shear pump (BMW's variable M
   * differential lock).
   */
  differential: sourced(
    z.enum([
      'open',
      'viscous-lsd',
      'helical-lsd',
      'torsen',
      'clutch-lsd',
      'speed-sensing-clutch-lsd',
    ]),
  ),
  /** As the market publishes it; say which standard in the note (JIS 車両重量, US curb weight, EU DIN). */
  curbWeight: Mass,
  /** Front axle share of curb weight, in percent. */
  weightFrontPercent: measured(['%'], z.number().min(30).max(70)).optional(),
  tyres: z.strictObject({ front: sourced(TyreSize), rear: sourced(TyreSize) }),
  wheels: z.strictObject({ front: sourced(WheelSize), rear: sourced(WheelSize) }).optional(),
  /** Governed top speed, where one applies (the JDM 180 km/h agreement). */
  speedLimiter: measured(UNITS.roadSpeed).optional(),
  /** Only the dimensions that differ from the car's base dimensions. */
  dimensions: Dimensions.partial().optional(),
  performanceTests: z.array(PerformanceTest).optional(),
  notes: z.string().min(1).optional(),
});
export type Trim = z.infer<typeof TrimSchema>;

/**
 * Mount-point positions and the engine-bay envelope. These have to be measured
 * from a to-scale 3D model or a dimensioned drawing. Until one exists the
 * status is `pending-model` and nothing is filled in (CLAUDE.md rule 2).
 * Coordinates: metres, origin at the front axle centre on the ground,
 * +x to the right, +y up, +z forward.
 */
const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
const Geometry = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('pending-model'),
    /** What will be measured, and from what. */
    plan: z.string().min(1),
  }),
  z.strictObject({
    status: z.literal('measured'),
    mountPoints: z.array(z.strictObject({ name: MountPointNameSchema, position: sourced(Vec3) })),
    bayEnvelope: z.strictObject({ min: sourced(Vec3), max: sourced(Vec3) }),
  }),
]);

/** Compares YYYY or YYYY-MM at the precision both sides share. */
function compareYearMonth(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  return a.slice(0, n).localeCompare(b.slice(0, n));
}

export const CarSchema = z
  .strictObject({
    $comment: z.string().optional(),
    id: SlugSchema,
    make: z.string().min(1),
    model: z.string().min(1),
    /** Chassis code, e.g. "S15" or "JZA80". */
    chassis: z.string().min(1),
    layout: z.enum(['FR', 'MR', 'RR', 'FF', 'AWD']),
    production: SourcedPeriodSchema,
    dimensions: Dimensions,
    transmissions: z.array(TransmissionSchema).min(1),
    trims: z.array(TrimSchema).min(1),
    geometry: Geometry,
  })
  .superRefine((car, ctx) => {
    const gearboxes = new Set<string>();
    car.transmissions.forEach((t, i) => {
      if (gearboxes.has(t.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['transmissions', i, 'id'],
          message: `Duplicate transmission id "${t.id}".`,
        });
      }
      gearboxes.add(t.id);
    });
    const trims = new Set<string>();
    car.trims.forEach((trim, i) => {
      if (trims.has(trim.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['trims', i, 'id'],
          message: `Duplicate trim id "${trim.id}".`,
        });
      }
      trims.add(trim.id);
      if (!gearboxes.has(trim.transmission)) {
        ctx.addIssue({
          code: 'custom',
          path: ['trims', i, 'transmission'],
          message: `Unknown transmission "${trim.transmission}".`,
        });
      }
      const { from, to } = trim.period.value;
      const prod = car.production.value;
      if (
        compareYearMonth(from, prod.from) < 0 ||
        (to !== undefined && prod.to !== undefined && compareYearMonth(to, prod.to) > 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['trims', i, 'period'],
          message: 'Trim period falls outside the car’s production period.',
        });
      }
    });
  });
export type Car = z.infer<typeof CarSchema>;
