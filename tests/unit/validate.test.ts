import { describe, expect, it } from 'vitest';
import { parseNpmSpec, validateData, type FileFacts } from '../../src/data/validate';
import manifest from '../../src/data/assets.json';

const MB = 1024 * 1024;
const HDRI = 'public/env/autoshop_01_night.pmrem';
const FONTS: Record<string, string> = {
  '@fontsource/barlow-condensed': '5.3.0',
  '@fontsource/ibm-plex-mono': '5.3.0',
};

function facts(overrides: Partial<FileFacts> = {}): FileFacts {
  return {
    sizeOf: (path) => (path === HDRI ? 485_110 : undefined),
    dependencyVersion: (name) => FONTS[name],
    dependencies: [...Object.keys(FONTS), 'three', 'zod'],
    publicFiles: [HDRI],
    sourceAssetFiles: [],
    ...overrides,
  };
}

const clean = { noAi: false, editorialOnly: false, gameRip: false, aiGenerated: false };
const asset = (over: Record<string, unknown>) => ({
  id: 'car',
  kind: 'model-car',
  title: 'Car',
  author: 'A',
  licence: 'CC0-1.0',
  licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  restrictions: clean,
  source: { url: 'https://example.com', accessed: '2026-09-26' },
  files: ['public/models/cars/car.glb'],
  status: 'final',
  ...over,
});
const run = (assets: unknown[], f: Partial<FileFacts> = {}) =>
  validateData(
    [{ path: 'src/data/assets.json', json: { assets } }],
    facts({ dependencies: [], ...f }),
  );
const messages = (report: ReturnType<typeof validateData>) =>
  report.issues.map((i) => `${i.path}: ${i.message}`).join('\n');

describe('validateData', () => {
  it('passes the committed manifest', () => {
    const report = validateData([{ path: 'src/data/assets.json', json: manifest }], facts());
    expect(report.issues).toEqual([]);
    expect(report.checkedFiles).toEqual(['src/data/assets.json']);
  });

  it('lists the files of NoAI assets so every session knows not to open them', () => {
    const report = run(
      [
        asset({
          licence: 'CC-BY-4.0',
          licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
          credit: '"Car" by A, CC BY 4.0',
          restrictions: { ...clean, noAi: true },
        }),
      ],
      { sizeOf: () => 1000, publicFiles: ['public/models/cars/car.glb'] },
    );
    expect(report.issues).toEqual([]);
    expect(report.noAiFiles).toEqual(['public/models/cars/car.glb']);
    expect(report.counts['asset with NoAI clause']).toBe(1);
  });

  it('flags a data file that no schema claims', () => {
    const report = validateData([{ path: 'src/data/parts/turbos/t28.json', json: {} }], facts());
    expect(report.issues[0]?.message).toMatch(/No schema is registered/);
  });

  it('reports schema errors with their JSON path', () => {
    const report = run([asset({ licence: 'CC-BY-NC-4.0' })]);
    expect(report.issues.some((i) => i.path === 'src/data/assets.json.assets[0].licence')).toBe(
      true,
    );
  });

  it.each([
    'public/fonts/Some.woff2',
    'public/logo.svg',
    'public/audio/sr20.ogg',
    'public/models/cars/s15.fbx',
    'public/data.exr.js',
  ])('flags the unlisted public file %s, whatever its type', (file) => {
    expect(messages(run([], { publicFiles: [file] }))).toContain(
      `${file}: Shipped file is not listed`,
    );
  });

  it('flags an unlisted asset file bundled from src/', () => {
    const file = 'src/scene/textures/concrete_diff.jpg';
    expect(messages(run([], { sourceAssetFiles: [file] }))).toContain(
      `${file}: Shipped file is not listed`,
    );
  });

  it('flags missing files and over-budget files', () => {
    const report = run(
      [
        asset({}),
        asset({ id: 'engine', kind: 'model-engine', files: ['public/models/engines/e.glb'] }),
      ],
      {
        sizeOf: (p) => (p.endsWith('e.glb') ? 9 * MB : undefined),
        publicFiles: ['public/models/engines/e.glb'],
      },
    );
    expect(messages(report)).toMatch(/car: file public\/models\/cars\/car.glb does not exist/);
    expect(messages(report)).toMatch(/engine: .* over the model-engine budget of 8.00 MB/);
  });

  it('takes the kind from the folder, so a car labelled as a prop still gets the car budget check', () => {
    const report = run([asset({ kind: 'model-prop', files: ['public/models/cars/s15.glb'] })], {
      sizeOf: () => 60 * MB,
      publicFiles: ['public/models/cars/s15.glb'],
    });
    expect(messages(report)).toMatch(
      /lives in the model-car folder but the asset says kind "model-prop"/,
    );
  });

  it('budgets a split glTF car as one download', () => {
    const files = [
      'public/models/cars/s.gltf',
      'public/models/cars/s.bin',
      'public/models/cars/s_body.png',
    ];
    const report = run([asset({ files })], {
      sizeOf: (p) => (p.endsWith('.gltf') ? MB / 10 : 13 * MB),
      publicFiles: files,
    });
    expect(messages(report)).toMatch(/car: all files together are .* over the model-car budget/);
  });

  it('flags an asset package in package.json that has no manifest entry', () => {
    const report = run([], { dependencies: ['@fontsource/oswald'] });
    expect(messages(report)).toMatch(/@fontsource\/oswald ships assets .* no entry/);
  });

  it('flags a font whose installed version differs, and a package that is not a direct dependency', () => {
    const drift = validateData(
      [{ path: 'src/data/assets.json', json: manifest }],
      facts({ dependencyVersion: () => '9.9.9' }),
    );
    expect(drift.issues.filter((i) => /is installed/.test(i.message))).toHaveLength(2);

    const transitive = run([
      asset({ id: 'font', kind: 'font', files: ['npm:magic-string@1.4.2'] }),
    ]);
    expect(messages(transitive)).toMatch(/magic-string is not a direct dependency/);
  });
});

describe('parseNpmSpec', () => {
  it('handles scoped and unscoped names', () => {
    expect(parseNpmSpec('npm:@fontsource/ibm-plex-mono@5.3.0')).toEqual({
      name: '@fontsource/ibm-plex-mono',
      version: '5.3.0',
    });
    expect(parseNpmSpec('npm:three@0.186.1')).toEqual({ name: 'three', version: '0.186.1' });
  });

  it('rejects malformed specs and path tricks', () => {
    expect(parseNpmSpec('npm:three')).toBeUndefined();
    expect(parseNpmSpec('npm:../../etc@1.0.0')).toBeUndefined();
    expect(parseNpmSpec('npm:@scope/a/b@1.0.0')).toBeUndefined();
  });
});
