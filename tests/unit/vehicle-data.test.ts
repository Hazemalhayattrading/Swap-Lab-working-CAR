import { describe, expect, it } from 'vitest';
import { CarSchema, type Car } from '../../src/data/schema/car';
import { EngineSchema, type Engine } from '../../src/data/schema/engine';
import { validateData, type DataFile } from '../../src/data/validate';
import { convert } from '../../src/data/units';
import {
  firingsPerRev,
  intakeVolumePerRevCc,
  wankelChamberDisplacementCc,
} from '../../src/data/displacement';

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

  it('covers the Phase 1 roster so far (parts 1, 2 and 3a)', () => {
    expect(cars.map((c) => c.id).sort()).toEqual([
      'bmw-3-series-e46',
      'mazda-rx-7-fd3s',
      'nissan-350z-z33',
      'nissan-silvia-s15',
      'toyota-supra-jza80',
    ]);
    expect(engines.map((e) => e.id).sort()).toEqual([
      '13b-rew',
      '20b-rew',
      '2jz-ge',
      '2jz-gte',
      'm54b30',
      's54b32',
      'sr20de',
      'sr20det',
      'vq35de',
      'vq35hr',
    ]);
    expect(
      engines
        .filter((e) => e.role === 'launch-swap')
        .map((e) => e.id)
        .sort(),
    ).toEqual(['13b-rew', '20b-rew', '2jz-gte', 's54b32', 'sr20det', 'vq35hr']);
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

  it('VQ35HR: 313 PS Japan, 306 hp US, 230 kW Europe, 7,500 rpm, all verified', () => {
    const jdm = variant('vq35hr', 'z33-jdm').output;
    expect(jdm.power).toMatchObject({ value: 313, unit: 'PS', confidence: 'verified' });
    expect(convert(jdm.torque.value, jdm.torque.unit, 'Nm')).toBeCloseTo(358, 0);
    expect(variant('vq35hr', 'z33-usdm').output.power).toMatchObject({
      value: 306,
      unit: 'hp',
      confidence: 'verified',
    });
    expect(variant('vq35hr', 'z33-usdm').output.standard).toBe('SAE-net');
    expect(variant('vq35hr', 'z33-eudm').output.power).toMatchObject({
      value: 230,
      unit: 'kW',
      confidence: 'verified',
    });
    expect(variant('vq35hr', 'z33-usdm').revLimit).toMatchObject({
      value: 7500,
      confidence: 'verified',
    });
  });

  it('VQ35DE: 280 PS / 287 hp / 206 kW, rev-up 294 PS / 300 hp / 221 kW', () => {
    const power = (id: string) => variant('vq35de', id).output.power;
    expect(power('z33-jdm')).toMatchObject({ value: 280, unit: 'PS' });
    expect(power('z33-jdm-35th')).toMatchObject({ value: 280, unit: 'PS' });
    expect(power('z33-jdm-revup')).toMatchObject({ value: 294, unit: 'PS' });
    expect(power('z33-usdm')).toMatchObject({ value: 287, unit: 'hp', confidence: 'verified' });
    expect(power('z33-usdm-revup')).toMatchObject({
      value: 300,
      unit: 'hp',
      confidence: 'verified',
    });
    expect(power('z33-eudm')).toMatchObject({ value: 206, unit: 'kW', confidence: 'verified' });
    expect(power('z33-eudm-revup')).toMatchObject({
      value: 221,
      unit: 'kW',
      confidence: 'verified',
    });
  });

  it('European 350Z torque curves peak at the rated torque and rpm', () => {
    for (const id of ['z33-eudm', 'z33-eudm-revup']) {
      const v = variant('vq35de', id);
      const curve = v.torqueCurve?.value ?? [];
      const peak = curve.reduce((a, b) => (b[1] > a[1] ? b : a));
      expect(peak, id).toEqual([v.output.torqueRpm.value, v.output.torque.value]);
    }
  });

  it('350Z: 3.538 final drive on every 6MT and 3.357 on every 5AT', () => {
    const z = car('nissan-350z-z33');
    for (const t of z.trims) {
      const box = z.transmissions.find((g) => g.id === t.transmission);
      expect(t.finalDrive.value, t.id).toBe(box?.type === 'manual' ? 3.538 : 3.357);
    }
    expect(z.trims.filter((t) => t.market === 'USDM').length).toBeGreaterThan(60);
  });

  it('S54B32: 343 PS Europe, 333 hp US, CSL 360 PS; every M3 on the 3.62 final drive', () => {
    expect(variant('s54b32', 'e46-m3-eudm').output.power).toMatchObject({
      value: 343,
      unit: 'PS',
      confidence: 'verified',
    });
    expect(variant('s54b32', 'e46-m3-usdm').output.power).toMatchObject({
      value: 333,
      unit: 'hp',
      confidence: 'verified',
    });
    expect(variant('s54b32', 'e46-m3-csl').output.power).toMatchObject({ value: 360, unit: 'PS' });
    const m3 = car('bmw-3-series-e46').trims.filter((t) => t.engine.id === 's54b32');
    expect(m3.length).toBe(13);
    for (const t of m3) {
      expect(t.finalDrive.value, t.id).toBe(3.62);
      expect(t.finalDrive.confidence, t.id).not.toBe('estimated');
    }
  });

  it('M54B30: 170 kW / 300 Nm Europe, 225 hp US, ZHP 235 hp and 6,800 rpm', () => {
    const eu = variant('m54b30', 'e46-eudm').output;
    expect(eu.power).toMatchObject({ value: 170, unit: 'kW', confidence: 'verified' });
    expect(eu.torque).toMatchObject({ value: 300, unit: 'Nm', confidence: 'verified' });
    expect(variant('m54b30', 'e46-usdm').output.power).toMatchObject({ value: 225, unit: 'hp' });
    expect(variant('m54b30', 'e46-usdm-zhp').output.power).toMatchObject({
      value: 235,
      unit: 'hp',
    });
    expect(variant('m54b30', 'e46-usdm-zhp').revLimit?.value).toBe(6800);
  });

  it('13B-REW: 654 cc x 2, R 105 / e 15 / b 80 mm, breathes 1,308 cc per shaft turn', () => {
    const e = engines.find((x) => x.id === '13b-rew');
    if (e?.layout !== 'rotary') throw new Error('13B-REW must be a rotary');
    expect(e.rotors).toBe(2);
    expect(e.displacement).toMatchObject({ value: 1308, unit: 'cc', confidence: 'verified' });
    expect(e.rotor.chamberDisplacement.value).toBe(654);
    expect(e.rotor.generatingRadius).toMatchObject({
      value: 105,
      unit: 'mm',
      confidence: 'verified',
    });
    const r = e.rotor;
    expect(
      wankelChamberDisplacementCc(r.generatingRadius.value, r.eccentricity.value, r.width.value),
    ).toBeCloseTo(654.7, 1);
    expect(intakeVolumePerRevCc(e)).toBe(1308);
    expect(firingsPerRev(e)).toBe(2);
  });

  it('13B-REW outputs: JDM 255/265/280 PS, US 255 hp, export 176 kW, all verified', () => {
    const power = (id: string) => variant('13b-rew', id).output.power;
    expect(power('fd3s-jdm-255')).toMatchObject({ value: 255, unit: 'PS', confidence: 'verified' });
    expect(power('fd3s-jdm-265')).toMatchObject({ value: 265, unit: 'PS', confidence: 'verified' });
    expect(power('fd3s-jdm-280')).toMatchObject({ value: 280, unit: 'PS', confidence: 'verified' });
    expect(power('fd3s-usdm-5mt')).toMatchObject({
      value: 255,
      unit: 'hp',
      confidence: 'verified',
    });
    expect(power('fd3s-export')).toMatchObject({ value: 176, unit: 'kW', confidence: 'verified' });
    expect(variant('13b-rew', 'fd3s-usdm-4at').output.powerRpm.value).toBe(6200);
    const t280 = variant('13b-rew', 'fd3s-jdm-280').output.torque;
    expect(convert(t280.value, t280.unit, 'Nm')).toBeCloseTo(313.8, 1);
  });

  it('20B-REW: three rotors, 654 cc x 3, 280 PS / 41.0 kgf·m at 3,000 rpm', () => {
    const e = engines.find((x) => x.id === '20b-rew');
    if (e?.layout !== 'rotary') throw new Error('20B-REW must be a rotary');
    expect(e.rotors).toBe(3);
    expect(e.displacement.value).toBe(1962);
    expect(intakeVolumePerRevCc(e)).toBe(1962);
    const out = variant('20b-rew', 'jcese-cosmo').output;
    expect(out.power).toMatchObject({ value: 280, unit: 'PS', confidence: 'verified' });
    expect(out.torque).toMatchObject({ value: 41.0, unit: 'kgf·m' });
    expect(out.torqueRpm.value).toBe(3000);
  });

  it('RX-7: gearing by market, the two-seat Spirit R Type A, and the SP', () => {
    const rx7 = car('mazda-rx-7-fd3s');
    const trim = (id: string) => {
      const t = rx7.trims.find((x) => x.id === id);
      if (!t) throw new Error(`no trim ${id}`);
      return t;
    };
    const fifth = (id: string) =>
      rx7.transmissions.find((g) => g.id === trim(id).transmission)?.ratios.value[4];
    expect(fifth('jdm-s1-type-r-5mt')).toBe(0.806);
    expect(trim('jdm-s1-type-r-5mt').finalDrive.value).toBe(4.1);
    expect(trim('jdm-s1-type-x-5mt').finalDrive.value).toBe(3.909);
    expect(fifth('jdm-s6-spirit-r-type-a-5mt')).toBe(0.762);
    expect(trim('jdm-s6-spirit-r-type-a-5mt').finalDrive.value).toBe(4.3);
    expect(fifth('usdm-1993-base-5mt')).toBe(0.719);
    const a = trim('jdm-s6-spirit-r-type-a-5mt');
    expect(a.seats?.value).toBe(2);
    expect(a.curbWeight).toMatchObject({ value: 1270, unit: 'kg', confidence: 'verified' });
    expect(a.engine).toEqual({ id: '13b-rew', variant: 'fd3s-jdm-280' });
    expect(trim('jdm-s6-spirit-r-type-c-4at').engine.variant).toBe('fd3s-jdm-4at');
    expect(trim('audm-1995-sp-5mt').curbWeight).toMatchObject({ value: 1218, unit: 'kg' });
    expect(trim('usdm-1993-base-5mt').curbWeight).toMatchObject({ value: 2789, unit: 'lb' });
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
