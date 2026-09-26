import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SourceSchema, setTodayForTests, siteOf, sourced } from '../../src/data/schema/source';

const hp = sourced(z.number().positive());
const src = (url: string, accessed = '2026-09-26') => ({ url, accessed });
const METHOD = 'Scaled from the 1JZ-GTE figure by displacement.';

afterEach(() => {
  setTodayForTests(() => new Date().toISOString().slice(0, 10));
});

describe('SourceSchema', () => {
  it('accepts an https URL with an ISO date', () => {
    expect(SourceSchema.safeParse(src('https://example.com/spec')).success).toBe(true);
  });

  it('rejects plain http, bad dates and unknown keys', () => {
    expect(SourceSchema.safeParse(src('http://example.com')).success).toBe(false);
    expect(SourceSchema.safeParse(src('https://example.com', '26/09/2026')).success).toBe(false);
    expect(SourceSchema.safeParse({ ...src('https://example.com'), extra: 1 }).success).toBe(false);
  });

  it.each(['https://tbd', 'https://localhost/x', 'https://127.0.0.1/x', 'https://[::1]/x'])(
    'rejects the placeholder or private host %s',
    (url) => {
      expect(SourceSchema.safeParse(src(url)).success).toBe(false);
    },
  );

  it('rejects an access date in the future', () => {
    setTodayForTests(() => '2026-09-26');
    expect(SourceSchema.safeParse(src('https://example.com', '2026-09-26')).success).toBe(true);
    expect(SourceSchema.safeParse(src('https://example.com', '2026-09-27')).success).toBe(false);
  });

  it('returns a validation error (not a crash) for a URL without a scheme', () => {
    const result = hp.safeParse({
      value: 1,
      confidence: 'single-source',
      sources: [src('www.nissan.co.jp/spec')],
    });
    expect(result.success).toBe(false);
  });
});

describe('siteOf', () => {
  it('groups subdomains, mobile and language editions under one site', () => {
    expect(siteOf('https://en.wikipedia.org/wiki/SR20')).toBe('wikipedia.org');
    expect(siteOf('https://en.m.wikipedia.org/wiki/SR20')).toBe('wikipedia.org');
    expect(siteOf('https://www.nissan.co.jp/x')).toBe('nissan.co.jp');
  });

  it('ignores a trailing dot', () => {
    expect(siteOf('https://example.com./a')).toBe('example.com');
  });

  it('looks through Wayback Machine links to the archived site', () => {
    expect(siteOf('https://web.archive.org/web/2020/https://example.com/a')).toBe('example.com');
  });

  it('returns undefined for unparseable URLs', () => {
    expect(siteOf('not a url')).toBeUndefined();
  });
});

describe('sourced values', () => {
  it('needs two different sites for "verified"', () => {
    const oneSite = hp.safeParse({
      value: 250,
      unit: 'PS',
      confidence: 'verified',
      sources: [src('https://a.example.com/1'), src('https://b.example.com/2')],
    });
    expect(oneSite.success).toBe(false);

    const twoSites = hp.safeParse({
      value: 250,
      unit: 'PS',
      confidence: 'verified',
      sources: [src('https://www.example.com/1'), src('https://example.org/2')],
    });
    expect(twoSites.success).toBe(true);
  });

  it.each([
    [
      'a mobile mirror',
      'https://en.wikipedia.org/wiki/SR20',
      'https://en.m.wikipedia.org/wiki/SR20',
    ],
    [
      'an archived copy',
      'https://example.com/a',
      'https://web.archive.org/web/2020/https://example.com/a',
    ],
    ['a trailing-dot host', 'https://example.com/a', 'https://example.com./a'],
  ])('does not count %s as a second site', (_label, a, b) => {
    expect(
      hp.safeParse({ value: 250, confidence: 'verified', sources: [src(a), src(b)] }).success,
    ).toBe(false);
  });

  it('needs at least one source for "single-source"', () => {
    expect(hp.safeParse({ value: 250, confidence: 'single-source', sources: [] }).success).toBe(
      false,
    );
    expect(
      hp.safeParse({
        value: 250,
        confidence: 'single-source',
        sources: [src('https://example.com')],
      }).success,
    ).toBe(true);
  });

  it('needs a real method for "estimated", with or without sources', () => {
    expect(hp.safeParse({ value: 250, confidence: 'estimated', sources: [] }).success).toBe(false);
    expect(
      hp.safeParse({ value: 250, confidence: 'estimated', sources: [], method: 'x' }).success,
    ).toBe(false);
    // BUILD_PROMPT section 2: no source found -> estimated, with the method on record.
    expect(
      hp.safeParse({ value: 250, confidence: 'estimated', sources: [], method: METHOD }).success,
    ).toBe(true);
    expect(
      hp.safeParse({
        value: 250,
        confidence: 'estimated',
        sources: [src('https://example.com')],
        method: METHOD,
      }).success,
    ).toBe(true);
  });

  it('checks the value itself', () => {
    expect(
      hp.safeParse({
        value: -5,
        confidence: 'single-source',
        sources: [src('https://example.com')],
      }).success,
    ).toBe(false);
  });
});
