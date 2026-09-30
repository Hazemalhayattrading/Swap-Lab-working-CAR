import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { buildCatalogue, type RawData } from '../src/data/loader';

/**
 * Serves `virtual:swaplab/catalogue`: the simulation's copy of the data
 * (src/data/loader.ts), built from the data files at build time. Sources,
 * notes and methods never reach the bundle. Validation is `npm run
 * validate-data`'s job, which CI runs before the build.
 */
export const CATALOGUE_ID = 'virtual:swaplab/catalogue';
const RESOLVED = `\0${CATALOGUE_ID}`;

function jsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, f));
}

export function readRawData(root: string): { raw: RawData; files: string[] } {
  const data = join(root, 'src', 'data');
  const cars = jsonFiles(join(data, 'cars'));
  const engines = jsonFiles(join(data, 'engines'));
  const standards = join(data, 'standards');
  const model = join(data, 'model', 'assumptions.json');
  const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
  const builds = jsonFiles(join(data, 'builds'));
  const raw = {
    cars: cars.map((f) => read(f)),
    engines: engines.map((f) => read(f)),
    powerRatings: read(join(standards, 'power-ratings.json')),
    fuels: read(join(standards, 'fuels.json')),
    weightBases: read(join(standards, 'weight-bases.json')),
    locations: read(join(standards, 'locations.json')),
    dynos: read(join(standards, 'dynos.json')),
    builds: builds.map((f) => read(f)),
    assumptions: read(model),
  } as RawData;
  return {
    raw,
    files: [...cars, ...engines, ...jsonFiles(standards), ...builds, model],
  };
}

export function catalogue(root = process.cwd()): Plugin {
  return {
    name: 'swaplab-catalogue',
    resolveId(id) {
      return id === CATALOGUE_ID ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return undefined;
      const { raw, files } = readRawData(root);
      for (const f of files) this.addWatchFile(f);
      // JSON.parse of a string literal parses faster than the same object literal.
      const json = JSON.stringify(buildCatalogue(raw));
      return `export default JSON.parse(${JSON.stringify(json)});`;
    },
  };
}
