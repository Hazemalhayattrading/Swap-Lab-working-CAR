import { describe, expect, it } from 'vitest';
import { ratingAtmosphere } from '../../src/sim/atmosphere';
import { PLAUSIBLE, TOLERANCE, checkStock } from '../../src/sim/calibrate/check';
import { ratingConditions } from '../../src/sim/calibrate/rating';
import { fitStockEngine } from '../../src/sim/calibrate/stock-model';
import { runDyno } from '../../src/sim/dyno';
import { FitCache, simulateTrim } from '../../src/sim/simulate';
import { catalogue } from '../support/catalogue';

/**
 * Stock calibration (BUILD_PROMPT 6.5, CLAUDE.md rule 3). Every car and trim,
 * at its own rating standard's reference conditions and rating fuel, must land
 * within 3 % of the factory peak power and torque with each peak within
 * 250 rpm, and within 3 % of every point of a published torque curve. The UI
 * runs the same check before it shows a trim's numbers, so CI failing here
 * means the site would withhold them.
 */

const cache = new FitCache();

describe.each(catalogue.cars)('stock calibration: $make $model ($chassis)', (car) => {
  it.each(car.trims)('$market $name ($id)', (trim) => {
    const sim = simulateTrim(catalogue, car.id, trim.id, undefined, cache);
    const c = sim.calibration;
    expect(c.failures).toEqual([]);
    expect(Math.abs(c.power.error)).toBeLessThanOrEqual(TOLERANCE.value);
    expect(Math.abs(c.torque.error)).toBeLessThanOrEqual(TOLERANCE.value);
    expect(Math.abs(c.power.modelRpm - c.power.factoryRpm)).toBeLessThanOrEqual(TOLERANCE.rpm);
    expect(Math.abs(c.torque.modelRpm - c.torque.factoryRpm)).toBeLessThanOrEqual(TOLERANCE.rpm);
    for (const point of c.curve ?? []) {
      expect(Math.abs(point.error), `${String(point.rpm)} rpm`).toBeLessThanOrEqual(
        TOLERANCE.value,
      );
    }
  });
});

describe('calibration against each figure’s own standard', () => {
  const variantOf = (engineId: string, variantId: string) => {
    const engine = catalogue.engines.find((e) => e.id === engineId);
    const variant = engine?.variants.find((v) => v.id === variantId);
    if (!engine || !variant) throw new Error(`${engineId}/${variantId}`);
    return { engine, variant };
  };

  it('rates JIS, SAE, DIN and EEC figures at their own reference atmospheres', () => {
    const cases = [
      ['sr20det', 's15-jdm', 'JIS-net'],
      ['2jz-gte', 'jza80-usdm', 'SAE-net'],
      ['ls1', 'holden-vt2', 'DIN-70020'],
      ['vq35de', 'z33-eudm', 'EEC-80/1269'],
    ] as const;
    for (const [engineId, variantId, standard] of cases) {
      const { variant } = variantOf(engineId, variantId);
      const rating = ratingConditions(catalogue, variant);
      expect(rating.standard.id).toBe(standard);
      expect(rating.assumed).toBe(false);
      const reference = catalogue.standards.find((s) => s.id === standard);
      expect(rating.air.temperature).toBe(reference?.temperature);
    }
  });

  it('flags figures whose standard the maker does not print as assumed', () => {
    const { variant } = variantOf('s54b32', 'e46-m3-eudm');
    expect(variant.rating.standard).toBe('unknown');
    const rating = ratingConditions(catalogue, variant);
    expect(rating.assumed).toBe(true);
    expect(rating.printedStandard).toBe('unknown');
  });

  it('resolves unlabelled figures by market and, in Australia, by sale date', () => {
    const cases = [
      ['ls1', 'holden-vx-v2', 'DIN-70020'], // Holden: VX Series II figures are DIN
      ['sr20det', 's15-audm', 'DIN-70020'],
      ['ls1', 'holden-vy', 'EEC-80/1269'], // Holden: the VY moved to ECE
      ['ls3', 'hsv-317kw', 'EEC-80/1269'],
      ['s54b32', 'e46-m3-csl', 'EEC-80/1269'],
      ['ls3', 'crate-ls3', 'SAE-net'],
    ] as const;
    for (const [engineId, variantId, standard] of cases) {
      const rating = ratingConditions(catalogue, variantOf(engineId, variantId).variant);
      expect(rating.assumed, variantId).toBe(true);
      expect(rating.standard.id, variantId).toBe(standard);
    }
  });

  it('puts the same LS1 about as far apart under DIN and ECE as Holden’s own figures', () => {
    // GoAuto, 23 Sep 2002, quoting Holden: "460Nm VXII DIN to 450Nm VY ECE", the same Gen III V8.
    const { engine, variant } = variantOf('ls1', 'holden-vx-v2');
    const k = catalogue.constants;
    const fit = fitStockEngine(engine, variant, ratingConditions(catalogue, variant), k);
    const peakAt = (id: string) => {
      const standard = catalogue.standards.find((s) => s.id === id);
      if (!standard) throw new Error(id);
      const air = ratingAtmosphere(standard);
      return runDyno(fit.model, { air, fuel: fit.conditions.fuel }, k).peakTorque.value;
    };
    const ratio = peakAt('DIN-70020') / peakAt('EEC-80/1269');
    expect(Math.abs(ratio - 460 / 450)).toBeLessThanOrEqual(0.01);
  });

  it('calibrates the two Nissan Europe 350Z engines against every point of their curves', () => {
    for (const variantId of ['z33-eudm', 'z33-eudm-revup']) {
      const car = catalogue.cars.find((c) => c.id === 'nissan-350z-z33');
      const trim = car?.trims.find((t) => t.engine.variant === variantId);
      if (!car || !trim) throw new Error(variantId);
      const sim = simulateTrim(catalogue, car.id, trim.id, undefined, cache);
      const curve = sim.calibration.curve ?? [];
      expect(curve.length).toBeGreaterThanOrEqual(17);
      expect(Math.max(...curve.map((p) => Math.abs(p.error)))).toBeLessThanOrEqual(0.03);
      expect(sim.fit.curve.source).toBe('published-curve');
    }
  });
});

describe('every engine variant, including swap-only engines', () => {
  const variants = catalogue.engines.flatMap((engine) =>
    engine.variants.map((variant) => ({ engine, variant, id: `${engine.id}/${variant.id}` })),
  );

  it.each(variants)('$id calibrates to its factory figures', ({ engine, variant }) => {
    const rating = ratingConditions(catalogue, variant);
    const fit = fitStockEngine(engine, variant, rating, catalogue.constants);
    const check = checkStock(fit, variant, runDyno(fit.model, fit.conditions, catalogue.constants));
    expect(check.failures).toEqual([]);
    expect(check.plausibility.veMax).toBeLessThanOrEqual(PLAUSIBLE.ve[1]);
    expect(check.plausibility.veMin).toBeGreaterThanOrEqual(PLAUSIBLE.ve[0]);
  });

  it('keeps the unpublished-boost VE prior at the mean of the published-boost fits', () => {
    const levels = variants
      .filter(({ variant }) => variant.boost !== undefined)
      .map(({ engine, variant }) => {
        const rating = ratingConditions(catalogue, variant);
        return fitStockEngine(engine, variant, rating, catalogue.constants).boost?.veLevel ?? 0;
      });
    expect(levels.length).toBeGreaterThanOrEqual(10);
    const mean = levels.reduce((s, x) => s + x, 0) / levels.length;
    expect(Math.abs(catalogue.constants['ve-prior-peak-boosted'] - mean)).toBeLessThanOrEqual(0.05);
  });
});
