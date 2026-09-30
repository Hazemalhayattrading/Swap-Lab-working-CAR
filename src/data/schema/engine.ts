import { z } from 'zod';
import { wankelChamberDisplacementCc } from '../displacement';
import { convert } from '../units';
import { measured, sourced } from './source';
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

/**
 * Engine data (BUILD_PROMPT section 7.1): one file per engine in src/data/engines/.
 *
 * Hardware shared by every version of an engine sits at the top level. What
 * differs by year or market (compression, turbos, injectors, cams, rated
 * output) sits in `variants`, and each car trim points at one variant.
 *
 * Piston engines and rotaries are separate shapes, told apart by `layout`: a
 * rotary has rotors, rotor geometry and ports instead of cylinders, bore,
 * stroke and valves, and it breathes on a different cycle (see
 * src/data/displacement.ts).
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

/**
 * A full-load torque curve as the maker published it: [rpm, torque] pairs in
 * `unit`, rising rpm. Only where a factory table exists (e.g. Nissan Europe's
 * 350Z data sheets); Phase 2 calibrates against it as well as the peaks.
 */
const TorqueCurve = sourced(
  z
    .array(z.tuple([z.number().positive(), z.number().positive()]))
    .min(3)
    .refine((pts) => pts.every((p, i) => i === 0 || p[0] > (pts[i - 1]?.[0] ?? 0)), {
      message: 'Curve points must be in rising rpm order.',
    }),
).refine((c) => (UNITS.torque as readonly string[]).includes(c.unit ?? ''), {
  message: `Torque curve needs a unit: one of ${UNITS.torque.join(', ')}.`,
  path: ['unit'],
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

/** Piston-engine variant. Rotary variants are the same without cams and cam phasing. */
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
  /**
   * Sequential twin turbos only: the rpm at which the second turbo comes on at
   * full load, where a source gives one (the maker's switch point varies with
   * load, so this is the full-throttle figure).
   */
  turboChangeover: Rpm.optional(),
  intercooler: sourced(z.enum(['none', 'air-to-air-front', 'air-to-air-side', 'air-to-water'])),
  /** Flow of one injector; there's one per cylinder or rotor (with staged fuelling, the primary). */
  injectorFlow: measured(UNITS.flow).optional(),
  /**
   * Staged fuelling (e.g. the 13B-REW): flow of one secondary injector, one per
   * cylinder or rotor, which the ECU adds at high load on top of the primaries.
   */
  secondaryInjectorFlow: measured(UNITS.flow).optional(),
  cams: Cams.optional(),
  /**
   * Cam phasing. `intake-and-exhaust-continuous` covers BMW double VANOS and
   * Nissan's CVTCS intake plus eCVTCS exhaust (VQ35HR).
   */
  variableValveTiming: sourced(
    z.enum(['none', 'intake-on-off', 'intake-continuous', 'intake-and-exhaust-continuous']),
  ),
  /**
   * Cam-profile switching (Honda VTEC): above `switchRpm` a longer, higher-lift
   * lobe takes over. `intake` also covers Honda's economy i-VTEC, which runs one
   * intake valve nearly shut at low rpm. Left out when there is none.
   */
  camProfileSwitching: z
    .strictObject({
      valves: sourced(z.enum(['intake', 'intake-and-exhaust'])),
      switchRpm: Rpm.optional(),
    })
    .optional(),
  output: Output,
  torqueCurve: TorqueCurve.optional(),
  /** Tachometer redline. */
  redline: Rpm.optional(),
  /** Fuel-cut rev limit, where the factory figure is published. */
  revLimit: Rpm.optional(),
  ecu: sourced(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
});

/** A rotary has ports, not valves, so there are no cams or cam phasing to record. */
export const RotaryEngineVariantSchema = EngineVariantSchema.omit({
  cams: true,
  variableValveTiming: true,
  camProfileSwitching: true,
});
export type EngineVariant =
  z.infer<typeof EngineVariantSchema> | z.infer<typeof RotaryEngineVariantSchema>;

/** A published "the stock part holds about this much" figure, with its context. */
function reportedLimit<const C extends readonly [string, ...string[]]>(components: C) {
  return z.strictObject({
    component: z.enum(components),
    quantity: z.enum(['crank-power', 'wheel-power', 'torque', 'rpm']),
    value: measured([...UNITS.power, ...UNITS.torque, ...UNITS.speed]),
    /** Conditions: fuel, rev limit, tune quality, how long it lasted. */
    context: z.string().min(1),
  });
}

const SumpPosition = z.enum(['front', 'centre', 'rear']);

/**
 * An oil pan the engine can run, and where its sump sits along the crank
 * (front = the crank-pulley end). Swaps pick one that clears the car's
 * crossmember, steering rack and ground: the 2JZ needs a front sump in an S14,
 * the LS an F-body or a swap pan.
 * - `factory`: fitted to a production engine; `fittedTo` names the donors.
 * - `maker-swap-part`: sold by the engine's maker for swaps (e.g. GM's LS retrofit pan).
 * - `aftermarket`: a third-party pan made for many swaps. A pan made for one
 *   car belongs in that car's swap file instead (src/data/swaps/).
 */
const SumpOption = z.strictObject({
  /** As the maker or the source names it, e.g. "F-body (Camaro/Firebird) pan". */
  name: z.string().min(1),
  kind: z.enum(['factory', 'maker-swap-part', 'aftermarket']),
  position: sourced(SumpPosition),
  /** Donor vehicles that came with it, descriptive only (e.g. "JZS161 Aristo"). */
  fittedTo: z.array(z.string().min(1)).min(1).optional(),
  partNumber: sourced(z.string().min(1)).optional(),
  /** Depth below the block rail, where a source prints it. */
  depth: Length.optional(),
  notes: z.string().min(1).optional(),
});

/** Fields every engine has, piston or rotary. */
const common = {
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
  /**
   * As the maker states it. For a rotary that is rotors x chamber displacement
   * (13B: 654 cc x 2 = 1,308 cc), never a doubled "piston-equivalent" figure or
   * a tax or racing-class figure. How it's used: src/data/displacement.ts.
   */
  displacement: measured(UNITS.displacement),
  /** Cylinder (or rotor, front = 1) numbers in firing order, e.g. [1, 5, 3, 6, 2, 4]. */
  firingOrder: sourced(z.array(z.number().int().min(1)).min(1)),
  fuelInjection: sourced(z.enum(['port', 'direct', 'carburettor'])),
  dryWeight: Mass.optional(),
  dimensions: z.strictObject({ length: Length, width: Length, height: Length }).optional(),
  /** Gearbox bolt pattern, as a shared id, e.g. "nissan-sr20" or "toyota-jz". */
  bellhousing: sourced(SlugSchema).optional(),
  /**
   * Sump position of the engine as fitted to its reference car (the note says
   * which). Where donors differ, `sumpOptions` lists every pan.
   */
  sump: sourced(SumpPosition).optional(),
  sumpOptions: z.array(SumpOption).min(1).optional(),
  oilCapacity: measured(UNITS.volume).optional(),
};

const PistonEngineSchema = z.strictObject({
  ...common,
  layout: z.enum(['inline', 'V', 'flat']),
  cylinders: z.number().int().min(1).max(16),
  bore: Length,
  stroke: Length,
  camLayout: sourced(z.enum(['DOHC', 'SOHC', 'OHV'])),
  valvesPerCylinder: sourced(z.number().int().min(2).max(5)),
  camDrive: sourced(z.enum(['belt', 'chain', 'gear'])),
  blockMaterial: sourced(z.enum(['cast-iron', 'aluminium'])),
  headMaterial: sourced(z.enum(['cast-iron', 'aluminium'])),
  internals: z
    .strictObject({
      crank: sourced(z.enum(['forged', 'cast'])),
      rods: sourced(z.enum(['forged', 'cast', 'powdered-metal'])),
      pistons: sourced(z.enum(['cast', 'hypereutectic', 'forged'])),
      reportedLimits: z.array(
        reportedLimit([
          'bottom-end',
          'rods',
          'rod-bolts',
          'pistons',
          'head-gasket',
          'crank',
          'oil-pump',
          'block',
          'valvetrain',
        ]),
      ),
    })
    .optional(),
  variants: z.array(EngineVariantSchema).min(1),
});

/**
 * One port event in eccentric-shaft (or crank) degrees, as the maker prints it,
 * e.g. intake opens 45° BTDC, closes 50° ABDC.
 */
const PortEvent = z.strictObject({
  ref: z.enum(['BTDC', 'ATDC', 'BBDC', 'ABDC']),
  angle: measured(UNITS.angle, z.number().min(0).max(180)),
});

const PortLocation = sourced(z.enum(['side', 'peripheral']));

const RotaryPorts = z.strictObject({
  /** Each intake port set (e.g. primary and secondary side ports) with its timing. */
  intake: z
    .array(
      z.strictObject({
        name: z.enum(['primary', 'secondary', 'auxiliary']),
        location: PortLocation,
        opens: PortEvent.optional(),
        closes: PortEvent.optional(),
      }),
    )
    .min(1),
  exhaust: z.strictObject({
    location: PortLocation,
    opens: PortEvent.optional(),
    closes: PortEvent.optional(),
  }),
});

const HousingMaterial = z.enum(['aluminium', 'cast-iron']);

const RotaryEngineSchema = z.strictObject({
  ...common,
  layout: z.literal('rotary'),
  rotors: z.number().int().min(1).max(6),
  /**
   * The Wankel geometry: generating radius R (rotor centre to apex tip),
   * eccentricity e (offset of the rotor journal from the shaft axis) and the
   * rotor housing width B. `chamberDisplacement` is the maker's swept volume of
   * one working chamber (its largest minus its smallest volume), 654 cc for the
   * 13B and 20B; in theory 3·√3·R·e·B.
   */
  rotor: z.strictObject({
    generatingRadius: Length,
    eccentricity: Length,
    width: Length,
    chamberDisplacement: measured(UNITS.displacement),
  }),
  ports: RotaryPorts.optional(),
  /** Leading and trailing plugs on the 13B-REW and 20B-REW. */
  sparkPlugsPerRotor: sourced(z.number().int().min(1).max(3)).optional(),
  materials: z.strictObject({
    rotorHousing: sourced(HousingMaterial),
    sideHousings: sourced(HousingMaterial),
    rotors: sourced(z.enum(['cast-iron', 'steel', 'aluminium'])),
  }),
  internals: z
    .strictObject({
      eccentricShaft: sourced(z.enum(['forged', 'cast'])),
      /** As printed, e.g. "two-piece cast iron". */
      apexSeals: sourced(z.string().min(1)),
      apexSealWidth: Length.optional(),
      reportedLimits: z.array(
        reportedLimit([
          'apex-seals',
          'side-seals',
          'rotor-housing',
          'eccentric-shaft',
          'rotors',
          'rotor-bearings',
          'stationary-gear',
          'coolant-seals',
          'oil-pump',
        ]),
      ),
    })
    .optional(),
  variants: z.array(RotaryEngineVariantSchema).min(1),
});

/** How far a maker's rounded figure may sit from the geometry it should match. */
const ROUNDING_TOLERANCE = 0.015;

export const EngineSchema = z
  .discriminatedUnion('layout', [PistonEngineSchema, RotaryEngineSchema])
  .superRefine((engine, ctx) => {
    const units = engine.layout === 'rotary' ? 'rotors' : 'cylinders';
    const count = engine.layout === 'rotary' ? engine.rotors : engine.cylinders;
    const expected = Array.from({ length: count }, (_, i) => i + 1);
    if ([...engine.firingOrder.value].sort((a, b) => a - b).join() !== expected.join()) {
      ctx.addIssue({
        code: 'custom',
        path: ['firingOrder', 'value'],
        message: `Firing order must list ${units} 1-${count} once each.`,
      });
    }
    if (engine.layout === 'rotary') {
      const { rotor } = engine;
      const chamber = rotor.chamberDisplacement.value;
      if (Math.abs(engine.displacement.value - engine.rotors * chamber) > 0.005 * chamber) {
        ctx.addIssue({
          code: 'custom',
          path: ['displacement', 'value'],
          message: `A rotary's displacement is rotors x chamber displacement (${engine.rotors} x ${chamber} cc).`,
        });
      }
      const mm = (l: { value: number; unit: 'mm' | 'in' }) => convert(l.value, l.unit, 'mm');
      const theory = wankelChamberDisplacementCc(
        mm(rotor.generatingRadius),
        mm(rotor.eccentricity),
        mm(rotor.width),
      );
      if (Math.abs(chamber - theory) > ROUNDING_TOLERANCE * theory) {
        ctx.addIssue({
          code: 'custom',
          path: ['rotor', 'chamberDisplacement', 'value'],
          message: `Chamber displacement ${chamber} cc doesn't match 3·√3·R·e·B = ${theory.toFixed(1)} cc.`,
        });
      }
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
      if (v.turboChangeover && v.induction.value !== 'twin-turbo-sequential') {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'turboChangeover'],
          message: 'Only a sequential twin-turbo variant has a changeover rpm.',
        });
      }
      if (v.secondaryInjectorFlow && !v.injectorFlow) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'secondaryInjectorFlow'],
          message: 'Staged fuelling needs the primary injector flow (`injectorFlow`) too.',
        });
      }
    });
  });
export type Engine = z.infer<typeof EngineSchema>;
export type RotaryEngine = Extract<Engine, { layout: 'rotary' }>;
export type PistonEngine = Exclude<Engine, { layout: 'rotary' }>;
