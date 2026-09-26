import { describe, expect, it } from 'vitest';
import { CarSchema, type Car } from '../../src/data/schema/car';
import { EngineSchema, type Engine } from '../../src/data/schema/engine';
import { validateData, type DataFile } from '../../src/data/validate';
import { convert } from '../../src/data/units';

/** The committed car and engine files, with the repo paths validate-data would see. */
function asFiles(modules: Record<string, unknown>): DataFile[] {
  return Object.entries(modules).map(([path, json]) => ({
    path: path.replace('../../', ''),
    json,
  }));
}

const carFiles = asFiles(
  import.meta.glob('../../src/data/cars/*.json', { eager: true, import: 'default' }),
);
const engineFiles = asFiles(
  import.meta.glob('../../src/data/engines/*.json', { eager: true, import: 'default' }),
);
const cars = carFiles.map((f) => CarSchema.parse(f.json));
const engines = engineFiles.map((f) => EngineSchema.parse(f.json));

const car = (id: string): Car => {
  const found = cars.find((c) => c.id === id);
  if (!found) throw new Error(`no car ${id}`);
  return found;
};
const variant = (engineId: string, variantId: string) => {
  const engine: Engine | undefined = engines.find((e) => e.id === engineId);
  const found = engine?.variants.find((v) => v.id === variantId);
  if (!found) throw new Error(`no variant ${engineId}/${variantId}`);
  return found;
};

describe('committed vehicle data', () => {
  it('passes validation, including trims pointing at real engine variants', () => {
    const report = validateData([...carFiles, ...engineFiles], {
      sizeOf: () => undefined,
      dependencyVersion: () => undefined,
      dependencies: [],
      publicFiles: [],
      sourceAssetFiles: [],
    });
    expect(report.issues).toEqual([]);
  });

  it('covers the Phase 1 part 1 roster', () => {
    expect(cars.map((c) => c.id).sort()).toEqual(['nissan-silvia-s15', 'toyota-supra-jza80']);
    expect(engines.map((e) => e.id).sort()).toEqual(['2jz-ge', '2jz-gte', 'sr20de', 'sr20det']);
    expect(
      engines
        .filter((e) => e.role === 'launch-swap')
        .map((e) => e.id)
        .sort(),
    ).toEqual(['2jz-gte', 'sr20det']);
  });

  // Spot checks of headline figures against what the sources print, so a bad
  // regeneration of a data file can't slip through unnoticed.
  it('S15 Spec-R 6MT: 250 PS, 28.0 kgf·m, 1,240 kg, verified', () => {
    const trim = car('nissan-silvia-s15').trims.find((t) => t.id === 'jdm-spec-r-6mt');
    expect(trim?.engine).toEqual({ id: 'sr20det', variant: 's15-jdm' });
    expect(trim?.curbWeight).toMatchObject({ value: 1240, unit: 'kg', confidence: 'verified' });
    const out = variant('sr20det', 's15-jdm').output;
    expect(out.power).toMatchObject({ value: 250, unit: 'PS', confidence: 'verified' });
    expect(convert(out.torque.value, out.torque.unit, 'Nm')).toBeCloseTo(274.6, 1);
  });

  it('2JZ-GTE: 280 PS JDM, 320 hp US, both verified', () => {
    expect(variant('2jz-gte', 'jza80-jdm').output.power).toMatchObject({
      value: 280,
      unit: 'PS',
      confidence: 'verified',
    });
    expect(variant('2jz-gte', 'jza80-usdm').output.power).toMatchObject({
      value: 320,
      unit: 'hp',
      confidence: 'verified',
    });
  });

  it('every trim has a sourced final drive and a gearbox with matching ratios', () => {
    for (const c of cars) {
      for (const t of c.trims) {
        const box = c.transmissions.find((g) => g.id === t.transmission);
        expect(box?.ratios.value.length, `${c.id}/${t.id}`).toBe(box?.gears);
        expect(t.finalDrive.value, `${c.id}/${t.id}`).toBeGreaterThan(2);
      }
    }
  });
});
