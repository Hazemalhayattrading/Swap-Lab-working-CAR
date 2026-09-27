import { describe, expect, it } from 'vitest';
import { AssetManifestSchema, AssetSchema } from '../../src/data/schema/asset';
import manifest from '../../src/data/assets.json';

const clean = { noAi: false, editorialOnly: false, gameRip: false, aiGenerated: false };
const base = {
  id: 'test-asset',
  kind: 'model-car',
  title: 'Test car',
  author: 'Someone',
  licence: 'CC0-1.0',
  licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  restrictions: clean,
  source: { url: 'https://example.com/model', accessed: '2026-09-26' },
  files: ['public/models/cars/test.glb'],
  status: 'final',
};
const ccBy = {
  ...base,
  licence: 'CC-BY-4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  credit: '"Car" by Someone, CC BY 4.0',
};

describe('AssetSchema', () => {
  it('accepts a CC0 asset and a credited CC-BY asset', () => {
    expect(AssetSchema.safeParse(base).success).toBe(true);
    expect(AssetSchema.safeParse(ccBy).success).toBe(true);
  });

  it.each(['CC-BY-NC-4.0', 'CC-BY-ND-4.0', 'CC-BY-SA-4.0', 'NoAI', 'Editorial'])(
    'cannot express the disallowed licence %s',
    (licence) => {
      expect(AssetSchema.safeParse({ ...base, licence }).success).toBe(false);
    },
  );

  it('accepts a NoAI clause on CC0 and CC-BY assets', () => {
    const restrictions = { ...clean, noAi: true };
    expect(AssetSchema.safeParse({ ...base, restrictions }).success).toBe(true);
    expect(AssetSchema.safeParse({ ...ccBy, restrictions }).success).toBe(true);
  });

  it('rejects a NoAI clause on any other licence', () => {
    const result = AssetSchema.safeParse({
      ...base,
      licence: 'commercial',
      licenceUrl: 'https://www.cgtrader.com/pages/terms-and-conditions',
      restrictions: { ...clean, noAi: true },
    });
    expect(result.error?.issues.map((i) => i.message).join()).toMatch(
      /only accepted on CC0 or CC-BY/,
    );
  });

  it('still requires the NoAI flag to be attested', () => {
    const { noAi: _omit, ...withoutNoAi } = clean;
    expect(AssetSchema.safeParse({ ...ccBy, restrictions: withoutNoAi }).success).toBe(false);
  });

  it.each(['editorialOnly', 'gameRip', 'aiGenerated'])(
    'rejects an otherwise allowed licence with the %s restriction',
    (flag) => {
      expect(
        AssetSchema.safeParse({ ...ccBy, restrictions: { ...clean, [flag]: true } }).success,
      ).toBe(false);
      expect(
        AssetSchema.safeParse({
          ...base,
          licence: 'commercial',
          restrictions: { ...clean, [flag]: true },
        }).success,
      ).toBe(false);
    },
  );

  it('requires the restrictions to be attested', () => {
    const { restrictions: _omit, ...withoutRestrictions } = base;
    expect(AssetSchema.safeParse(withoutRestrictions).success).toBe(false);
  });

  it('rejects a licence URL that does not match the licence', () => {
    expect(
      AssetSchema.safeParse({ ...base, licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' })
        .success,
    ).toBe(false);
  });

  it.each([
    'https://creativecommons.org/licenses/by-nc/4.0/',
    'https://creativecommons.org/licenses/by-nd/4.0/deed.en',
    'https://creativecommons.org/licenses/by-sa/3.0/',
  ])('rejects the NC/ND/SA licence URL %s even for a commercial licence', (licenceUrl) => {
    expect(AssetSchema.safeParse({ ...ccBy, licenceUrl }).success).toBe(false);
    expect(AssetSchema.safeParse({ ...base, licence: 'commercial', licenceUrl }).success).toBe(
      false,
    );
  });

  it('requires a credit line for CC-BY', () => {
    const { credit: _omit, ...uncredited } = ccBy;
    expect(AssetSchema.safeParse(uncredited).success).toBe(false);
  });

  it('keeps origin claims honest', () => {
    const origin = { url: 'https://example.org/original', accessed: '2026-09-26' };
    expect(AssetSchema.safeParse({ ...base, origin }).success).toBe(false);
    expect(AssetSchema.safeParse({ ...base, origin, originConfidence: 'estimated' }).success).toBe(
      true,
    );
    // One origin URL can never be "verified", and a confidence needs an origin.
    expect(AssetSchema.safeParse({ ...base, origin, originConfidence: 'verified' }).success).toBe(
      false,
    );
    expect(AssetSchema.safeParse({ ...base, originConfidence: 'estimated' }).success).toBe(false);
  });

  it('rejects ids that are not slugs', () => {
    expect(AssetSchema.safeParse({ ...base, id: 'Test Asset' }).success).toBe(false);
  });
});

describe('AssetManifestSchema', () => {
  it('rejects duplicate ids', () => {
    expect(AssetManifestSchema.safeParse({ assets: [base, base] }).success).toBe(false);
  });

  it('accepts the committed manifest', () => {
    const result = AssetManifestSchema.safeParse(manifest);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('uses the Poly Haven original as the final HDRI, taken straight from the source', () => {
    const hdri = manifest.assets.find((a) => a.kind === 'hdri');
    expect(hdri?.id).toBe('autoshop_01');
    expect(hdri?.status).toBe('final');
    expect(hdri?.source.url).toBe('https://polyhaven.com/a/autoshop_01');
    expect(hdri && 'origin' in hdri).toBe(false);
  });
});
