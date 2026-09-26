import { getDomain } from 'tldts';
import { z } from 'zod';

/**
 * Provenance for any number, price or asset in Swap Lab (CLAUDE.md rule 2).
 * Every value carries where it came from, when it was read, and how sure we are.
 */

export const IsoDateSchema = z.iso.date();

/** Today's date as YYYY-MM-DD in UTC; injectable so tests don't depend on the clock. */
let today = (): string => new Date().toISOString().slice(0, 10);
export function setTodayForTests(fn: () => string): void {
  today = fn;
}

function isPublicHostname(hostname: string): boolean {
  const host = hostname.replace(/\.$/, '');
  if (!host.includes('.')) return false; // "localhost", "tbd"
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) return false; // IP literals
  return getDomain(host) !== null;
}

export const SourceSchema = z.strictObject({
  /** Public HTTPS page where the value or file can be checked. */
  url: z
    .url({ protocol: /^https$/ })
    .refine((u) => URL.canParse(u) && isPublicHostname(new URL(u).hostname), {
      message: 'Must be a public website address (not localhost, an IP or a placeholder).',
    }),
  /** Date the page was read, YYYY-MM-DD. Can't be in the future. */
  accessed: IsoDateSchema.refine((d) => d <= today(), {
    message: 'Access date is in the future.',
  }),
  title: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const ConfidenceSchema = z.enum(['verified', 'single-source', 'estimated']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

/**
 * The site a URL belongs to, for "is this an independent source?" checks.
 * Uses the registrable domain (en.m.wikipedia.org and wikipedia.org are one site),
 * and looks through Wayback Machine links to the page they archived.
 * Returns undefined for URLs that don't parse (the URL check reports those).
 */
export function siteOf(url: string): string | undefined {
  if (!URL.canParse(url)) return undefined;
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/\.$/, '').toLowerCase();
  if (host === 'web.archive.org' || host === 'archive.org') {
    const embedded = /\/web\/[^/]+\/(https?:\/\/.+)$/.exec(parsed.pathname + parsed.search);
    if (embedded?.[1]) return siteOf(embedded[1].replace(/^http:/, 'https:'));
  }
  return getDomain(host) ?? host;
}

/** Minimum length of an `estimated` method: enough to say what it was derived from. */
export const MIN_METHOD_LENGTH = 20;

/**
 * The confidence label has to match the evidence behind it:
 * - `verified` needs at least two sources on different sites.
 * - `single-source` needs at least one source.
 * - `estimated` needs a `method` saying how it was estimated and from what.
 *   Sources are optional here: BUILD_PROMPT section 2 says a value with no source
 *   is marked `estimated` and shown as such in the UI, never passed off as fact.
 */
export function checkConfidence(
  value: { confidence: Confidence; sources: readonly Source[]; method?: string | undefined },
  ctx: z.RefinementCtx,
): void {
  const sites = new Set(value.sources.map((s) => siteOf(s.url)).filter((s) => s !== undefined));
  if (value.confidence === 'verified' && sites.size < 2) {
    ctx.addIssue({
      code: 'custom',
      path: ['sources'],
      message: `"verified" needs sources on at least 2 different sites (found ${sites.size}).`,
    });
  }
  if (value.confidence === 'single-source' && value.sources.length < 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['sources'],
      message: '"single-source" needs at least 1 source.',
    });
  }
  if (value.confidence === 'estimated' && (value.method?.trim().length ?? 0) < MIN_METHOD_LENGTH) {
    ctx.addIssue({
      code: 'custom',
      path: ['method'],
      message: `"estimated" needs a method (at least ${MIN_METHOD_LENGTH} characters) that explains how the estimate was made.`,
    });
  }
}

/** A single sourced value, e.g. `{ value: 250, unit: 'PS', confidence, sources }`. */
export function sourced<T extends z.ZodType>(value: T) {
  return z
    .strictObject({
      value,
      unit: z.string().min(1).optional(),
      confidence: ConfidenceSchema,
      sources: z.array(SourceSchema),
      method: z.string().min(1).optional(),
    })
    .superRefine(checkConfidence);
}
