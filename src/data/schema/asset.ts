import { z } from 'zod';
import { SourceSchema } from './source';

/**
 * Third-party assets that ship with the site: HDRIs, textures, models, fonts.
 * The manifest is the single list the /credits page will be built from.
 *
 * CLAUDE.md rule 5 is enforced in three layers:
 * 1. The licence enum only holds licences the rule allows (no NC, ND or SA).
 * 2. The licence URL must be the canonical page for that licence, so an NC deed
 *    can't sit next to a CC-BY label.
 * 3. Restrictions that ride on top of an allowed licence (a NoAI clause,
 *    editorial-only use, a game rip, an AI-generated model) must each be
 *    explicitly attested `false` from the listing page.
 */
export const LicenceSchema = z.enum([
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'OFL-1.1',
  'MIT',
  'Apache-2.0',
  'commercial',
]);
export type Licence = z.infer<typeof LicenceSchema>;

/** Canonical licence pages. `commercial` links to the vendor's own licence terms instead. */
export const LICENCE_URL_PREFIXES: Record<Exclude<Licence, 'commercial'>, readonly string[]> = {
  'CC0-1.0': ['https://creativecommons.org/publicdomain/zero/1.0'],
  'CC-BY-4.0': ['https://creativecommons.org/licenses/by/4.0'],
  'CC-BY-3.0': ['https://creativecommons.org/licenses/by/3.0'],
  'OFL-1.1': ['https://openfontlicense.org', 'https://scripts.sil.org/OFL'],
  MIT: ['https://opensource.org/license/mit', 'https://opensource.org/licenses/MIT'],
  'Apache-2.0': [
    'https://www.apache.org/licenses/LICENSE-2.0',
    'https://apache.org/licenses/LICENSE-2.0',
  ],
};

/** Creative Commons deeds with NC, ND or SA terms, in any version or language. */
const DISALLOWED_CC_URL = /creativecommons\.org\/licenses\/[a-z-]*(nc|nd|sa)[a-z-]*\//i;

export const AssetKindSchema = z.enum([
  'hdri',
  'texture',
  'model-car',
  'model-engine',
  'model-part',
  'model-prop',
  'font',
]);
export type AssetKind = z.infer<typeof AssetKindSchema>;

export const AssetStatusSchema = z.enum([
  /** The asset we intend to keep. */
  'final',
  /** Real and correctly licensed, but a stop-gap until a better file is sourced. */
  'interim',
  /** Grey clay stand-in; the UI must tag it PLACEHOLDER (CLAUDE.md rule 4). */
  'placeholder',
]);

/**
 * Each flag must be checked on the listing page and recorded as `false`.
 * An asset where any of these is true can't be used (CLAUDE.md rule 5).
 */
export const RestrictionsSchema = z.strictObject({
  noAi: z.literal(false),
  editorialOnly: z.literal(false),
  gameRip: z.literal(false),
  aiGenerated: z.literal(false),
});

const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/, 'lowercase letters, digits, - and _ only');

export const AssetSchema = z
  .strictObject({
    id: slug,
    kind: AssetKindSchema,
    title: z.string().min(1),
    author: z.string().min(1),
    licence: LicenceSchema,
    licenceUrl: z.url({ protocol: /^https$/ }),
    restrictions: RestrictionsSchema,
    /** Where our copy of the file came from. */
    source: SourceSchema,
    /**
     * The original upstream work, when `source` is a mirror or package that
     * redistributes it. One origin URL can support `single-source` or
     * `estimated`, never `verified`.
     */
    origin: SourceSchema.optional(),
    originConfidence: z.enum(['single-source', 'estimated']).optional(),
    /** Repo-relative paths under public/, or an npm package specifier for fonts. */
    files: z.array(z.string().min(1)).min(1),
    status: AssetStatusSchema,
    /** Attribution line for CC-BY assets, shown on /credits. */
    credit: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
  })
  .superRefine((asset, ctx) => {
    if (asset.licence.startsWith('CC-BY') && !asset.credit) {
      ctx.addIssue({
        code: 'custom',
        path: ['credit'],
        message: 'CC-BY assets need a credit line for /credits.',
      });
    }
    if (DISALLOWED_CC_URL.test(asset.licenceUrl)) {
      ctx.addIssue({
        code: 'custom',
        path: ['licenceUrl'],
        message:
          'Licence URL points to an NC, ND or SA Creative Commons licence, which CLAUDE.md rule 5 excludes.',
      });
    } else if (asset.licence !== 'commercial') {
      const prefixes = LICENCE_URL_PREFIXES[asset.licence];
      if (!prefixes.some((p) => asset.licenceUrl.startsWith(p))) {
        ctx.addIssue({
          code: 'custom',
          path: ['licenceUrl'],
          message: `Licence URL doesn't match ${asset.licence}; expected it to start with ${prefixes.join(' or ')}.`,
        });
      }
    }
    if (asset.origin && !asset.originConfidence) {
      ctx.addIssue({
        code: 'custom',
        path: ['originConfidence'],
        message: 'Say how sure we are of the origin (single-source or estimated).',
      });
    }
    if (!asset.origin && asset.originConfidence) {
      ctx.addIssue({
        code: 'custom',
        path: ['originConfidence'],
        message: 'originConfidence without an origin.',
      });
    }
  });
export type Asset = z.infer<typeof AssetSchema>;

export const AssetManifestSchema = z
  .strictObject({
    $comment: z.string().optional(),
    assets: z.array(AssetSchema),
  })
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    manifest.assets.forEach((asset, i) => {
      if (seen.has(asset.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['assets', i, 'id'],
          message: `Duplicate asset id "${asset.id}".`,
        });
      }
      seen.add(asset.id);
    });
  });
export type AssetManifest = z.infer<typeof AssetManifestSchema>;
