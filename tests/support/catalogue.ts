import { buildCatalogue, type RawData } from '../../src/data/loader';

/**
 * The simulation catalogue built from the committed data files, exactly as the
 * site's build does it (scripts/vite-plugin-catalogue.ts), for tests.
 */
function all(modules: Record<string, unknown>): unknown[] {
  return Object.keys(modules)
    .sort()
    .map((k) => modules[k]);
}

const one = (modules: Record<string, unknown>): unknown => {
  const values = Object.values(modules);
  if (values.length !== 1) throw new Error('expected one file');
  return values[0];
};

export const rawData = {
  cars: all(import.meta.glob('../../src/data/cars/*.json', { eager: true, import: 'default' })),
  engines: all(
    import.meta.glob('../../src/data/engines/*.json', { eager: true, import: 'default' }),
  ),
  powerRatings: one(
    import.meta.glob('../../src/data/standards/power-ratings.json', {
      eager: true,
      import: 'default',
    }),
  ),
  fuels: one(
    import.meta.glob('../../src/data/standards/fuels.json', { eager: true, import: 'default' }),
  ),
  weightBases: one(
    import.meta.glob('../../src/data/standards/weight-bases.json', {
      eager: true,
      import: 'default',
    }),
  ),
  locations: one(
    import.meta.glob('../../src/data/standards/locations.json', { eager: true, import: 'default' }),
  ),
  dynos: one(
    import.meta.glob('../../src/data/standards/dynos.json', { eager: true, import: 'default' }),
  ),
  builds: all(import.meta.glob('../../src/data/builds/*.json', { eager: true, import: 'default' })),
  assumptions: one(
    import.meta.glob('../../src/data/model/assumptions.json', { eager: true, import: 'default' }),
  ),
} as RawData;

export const catalogue = buildCatalogue(rawData);
