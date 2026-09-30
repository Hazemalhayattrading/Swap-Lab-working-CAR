import { describe, expect, it } from 'vitest';
import { referenceCurve } from '../../src/sim/calibrate/reference-curve';
import { omega } from '../../src/sim/math';
import { catalogue, rawData } from '../support/catalogue';

const trim = (carId: string, trimId: string) => {
  const t = catalogue.cars.find((c) => c.id === carId)?.trims.find((x) => x.id === trimId);
  if (!t) throw new Error(`${carId}/${trimId}`);
  return t;
};
const variant = (engineId: string, variantId: string) => {
  const v = catalogue.engines
    .find((e) => e.id === engineId)
    ?.variants.find((x) => x.id === variantId);
  if (!v) throw new Error(`${engineId}/${variantId}`);
  return v;
};

/** Every key used anywhere in a JSON value. */
function keys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const v of value) keys(v, out);
  else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      out.add(key);
      keys(v, out);
    }
  }
  return out;
}

describe('the catalogue the site ships', () => {
  it('carries no sources, notes or methods for cars and engines', () => {
    const shipped = keys({ cars: catalogue.cars, engines: catalogue.engines });
    for (const key of ['sources', 'note', 'notes', 'method', 'url', 'accessed', '$comment']) {
      expect(shipped.has(key), key).toBe(false);
    }
    // The raw files are several megabytes because of their sources; the catalogue isn't.
    const raw = JSON.stringify({ cars: rawData.cars, engines: rawData.engines }).length;
    const lean = JSON.stringify({ cars: catalogue.cars, engines: catalogue.engines }).length;
    expect(raw).toBeGreaterThan(5_000_000);
    expect(lean).toBeLessThan(raw / 15);
  });

  it('keeps every value’s confidence where the UI must flag it', () => {
    const v = variant('ls1', 'fbody-ss-ws6-1998-2000');
    expect(v.rating.torqueRpm.confidence).toBe('estimated');
    expect(v.rating.power.confidence).toBe('verified');
  });

  it('converts ratings to SI and keeps the printed figures', () => {
    const v = variant('sr20det', 's15-jdm');
    expect(v.rating.power.value).toBeCloseTo(250 * 735.49875, 6);
    expect(v.rating.torque.value).toBeCloseTo(28 * 9.80665, 6);
    expect(v.rating.printed).toEqual({ power: '250 PS', torque: '28.0 kgf·m' });
    expect(v.boost?.value).toBeCloseTo(9 * 6894.757293168, 3);
    expect(v.injectorFlow?.value).toBeCloseTo(480e-6 / 60, 12);
  });

  it('keeps sourced sequential changeover rpm', () => {
    expect(variant('2jz-gte', 'jza80-usdm').turboChangeover?.value).toBe(4000);
    expect(variant('13b-rew', 'fd3s-jdm-280').turboChangeover?.value).toBe(4500);
    expect(variant('20b-rew', 'jcese-cosmo').turboChangeover?.value).toBe(3500);
  });
});

describe('curb weights on one basis (full fuel, no driver)', () => {
  it('leaves JIS and US curb weights as printed', () => {
    const s15 = trim('nissan-silvia-s15', 'jdm-spec-r-6mt').weight;
    expect(s15).toMatchObject({ kg: 1240, printedKg: 1240, adjustmentKg: 0 });
    const us = trim('bmw-3-series-e46', 'usdm-m3-coupe-6mt').weight;
    expect(us.basis).toBe('us-curb-weight');
    expect(us.kg).toBeCloseTo(3415 * 0.45359237, 6);
  });

  it('takes the 75 kg driver out of an EU mass in running order', () => {
    const w = trim('bmw-3-series-e46', 'eudm-330i-sedan-5mt').weight;
    expect(w.basis).toBe('eu-mass-in-running-order');
    expect(w.printedKg).toBe(1505);
    expect(w.kg).toBe(1430); // the DIN figure BMW AG's note gives
    expect(w.adjustmentKg).toBe(-75);
  });

  it('keeps a DIN kerb weight, with room for the 10 % of tank it leaves out', () => {
    const w = trim('bmw-3-series-e46', 'eudm-m3-coupe-6mt').weight;
    expect(w).toMatchObject({ basis: 'din-kerb-weight', kg: 1495, adjustmentKg: 0 });
    expect(w.rangeKg[1]).toBeGreaterThan(1495);
  });

  it('says a weight of unstated basis could hide a driver or a part-full tank', () => {
    const w = trim('toyota-supra-jza80', 'eudm-turbo-6mt').weight;
    expect(w.basis).toBe('unstated');
    expect(w.kg).toBe(1615);
    expect(w.rangeKg).toEqual([1615 - 75, 1615 + 6]);
  });
});

describe('the stock reference curve', () => {
  const k = catalogue.constants;
  const peaks = (engineId: string, variantId: string, boosted: boolean) => {
    const v = variant(engineId, variantId);
    const curve = referenceCurve(v, boosted, k);
    let t = { v: -Infinity, n: 0 };
    let p = { v: -Infinity, n: 0 };
    curve.grid.forEach((n, i) => {
      const torque = curve.torque[i] ?? Number.NaN;
      if (!Number.isFinite(torque)) return;
      if (torque > t.v) t = { v: torque, n };
      if (torque * omega(n) > p.v) p = { v: torque * omega(n), n };
    });
    return { v, curve, t, p };
  };

  it('passes through both published peaks, flat plateau and all (SR20DET S15)', () => {
    const { v, t, p } = peaks('sr20det', 's15-jdm', true);
    expect(t.n).toBe(v.rating.torqueRpm.value);
    expect(t.v).toBeCloseTo(v.rating.torque.value, 6);
    expect(p.n).toBe(v.rating.powerRpm.value);
    expect(p.v).toBeCloseTo(v.rating.power.value, 3);
  });

  it('handles torque that falls steeply while power still climbs (RB26DETT BNR34)', () => {
    const { v, t, p } = peaks('rb26dett', 'bnr34', true);
    expect(t.n).toBe(v.rating.torqueRpm.value);
    expect(p.n).toBe(v.rating.powerRpm.value);
  });

  it('uses the maker’s own curve where one is published', () => {
    const { curve } = peaks('vq35de', 'z33-eudm', false);
    expect(curve.source).toBe('published-curve');
    expect(curve.anchors).toHaveLength(17);
    expect(curve.torque[curve.grid.indexOf(4800)]).toBeCloseTo(363, 6);
  });

  it('leaves the turbo spool region to the turbo model', () => {
    const { curve } = peaks('2jz-gte', 'jza80-usdm', true);
    expect(curve.start).toBe(3500);
    expect(Number.isNaN(curve.torque[0])).toBe(true);
  });
});
