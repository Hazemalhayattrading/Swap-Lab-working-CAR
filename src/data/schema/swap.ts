import { z } from 'zod';
import { sourced } from './source';
import { Price, SlugSchema } from './common';

/**
 * Engine swaps (BUILD_PROMPT section 3): one file per car and engine family in
 * src/data/swaps/, e.g. `nissan-silvia-s15--gm-ls.json`.
 *
 * A swap file lists the hardware real builds use: the parts, each as its vendor
 * or maker lists it (name, part number, price, what's in the box, what it says
 * you also need), and the slot or slots each one fills. Several parts filling
 * one slot are alternatives; a kit fills several slots at once.
 *
 * This is a record of what exists, with sources, not a fitment rule. Phase 3
 * turns it into the parts catalogue and the compatibility rules, and Phase 4's
 * measured bay geometry is what clearance checks will use (docs/decisions.md).
 */

export const SWAP_SLOTS = [
  'engine-mounts',
  'transmission-mount',
  'gearbox',
  'bellhousing-adapter',
  'clutch',
  'oil-pan',
  'headers',
  'wiring-harness',
  'ecu',
  'driveshaft',
  'cooling',
  'fuel-system',
  'accessory-drive',
  'steering',
  'other',
] as const;
export const SwapSlotSchema = z.enum(SWAP_SLOTS);
export type SwapSlot = z.infer<typeof SwapSlotSchema>;

/**
 * BUILD_PROMPT section 3: every launch swap needs "the right swap kit, mounts,
 * adapter, sump, wiring and ECU". The gearbox slot covers the adapter: its
 * options are either a gearbox that bolts to the engine, or the car's own
 * gearbox paired with an adapter.
 */
export const REQUIRED_SWAP_SLOTS: readonly SwapSlot[] = [
  'engine-mounts',
  'gearbox',
  'oil-pan',
  'wiring-harness',
  'ecu',
];

export const SwapPartSchema = z.strictObject({
  id: SlugSchema,
  /** "Sikky Manufacturing", or "General Motors (donor part)" for a used factory part. */
  vendor: z.string().min(1),
  /** The product name as listed; its sources are the product page or catalogue. */
  product: sourced(z.string().min(1)),
  fills: z.array(SwapSlotSchema).min(1),
  partNumber: sourced(z.string().min(1)).optional(),
  price: Price.optional(),
  /** The swap's engines this part is for, when it doesn't suit all of them (e.g. a 24x or 58x ECU). */
  engines: z.array(SlugSchema).min(1).optional(),
  /** What the listing says is included. */
  includes: sourced(z.array(z.string().min(1)).min(1)).optional(),
  /** What the listing says you need with it, in its words. */
  requires: sourced(z.array(z.string().min(1)).min(1)).optional(),
  /** Ids of other parts in this file that it needs or is sold to pair with. */
  pairsWith: z.array(SlugSchema).optional(),
  notes: z.string().min(1).optional(),
});
export type SwapPart = z.infer<typeof SwapPartSchema>;

export const SwapSchema = z
  .strictObject({
    $comment: z.string().optional(),
    id: SlugSchema,
    /** Car file id, e.g. "nissan-silvia-s15". */
    car: SlugSchema,
    /** Launch-swap engine ids this hardware is for, e.g. ["ls1", "ls3"]. */
    engines: z.array(SlugSchema).min(1),
    /** Which of the car's trims or years it covers, where not all (e.g. "2003-2006 cars"). */
    appliesTo: z.string().min(1).optional(),
    parts: z.array(SwapPartSchema).min(1),
    /**
     * Facts about the car that decide what fits, as a source states them
     * (e.g. "the S14 front suspension member also fits the S15"). Anything a
     * listing says about one part goes on that part instead.
     */
    fitment: z.array(sourced(z.string().min(1))).optional(),
    /** Cutting, drilling or relocation a source says the swap needs (or says it doesn't). */
    modifications: z.array(sourced(z.string().min(1))).optional(),
    notes: z.string().min(1).optional(),
  })
  .superRefine((swap, ctx) => {
    const ids = new Set<string>();
    swap.parts.forEach((part, i) => {
      if (ids.has(part.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['parts', i, 'id'],
          message: `Duplicate part id "${part.id}".`,
        });
      }
      ids.add(part.id);
      part.engines?.forEach((e, j) => {
        if (!swap.engines.includes(e)) {
          ctx.addIssue({
            code: 'custom',
            path: ['parts', i, 'engines', j],
            message: `"${e}" is not one of this swap's engines (${swap.engines.join(', ')}).`,
          });
        }
      });
    });
    swap.parts.forEach((part, i) => {
      part.pairsWith?.forEach((other, j) => {
        if (!ids.has(other) || other === part.id) {
          ctx.addIssue({
            code: 'custom',
            path: ['parts', i, 'pairsWith', j],
            message: `No other part "${other}" in this swap.`,
          });
        }
      });
    });
    const filled = new Set(swap.parts.flatMap((p) => p.fills));
    for (const slot of REQUIRED_SWAP_SLOTS) {
      if (!filled.has(slot)) {
        ctx.addIssue({
          code: 'custom',
          path: ['parts'],
          message: `No part fills the "${slot}" slot (BUILD_PROMPT section 3 needs mounts, gearbox or adapter, sump, wiring and ECU).`,
        });
      }
    }
  });
export type Swap = z.infer<typeof SwapSchema>;
