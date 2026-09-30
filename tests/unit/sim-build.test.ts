import { describe, expect, it } from 'vitest';
import type { SimBuildSpec } from '../../src/data/sim-data';
import { ambientAir } from '../../src/sim/atmosphere';
import { applyBuild } from '../../src/sim/build';
import { ratingConditions } from '../../src/sim/calibrate/rating';
import { runDyno } from '../../src/sim/dyno';
import { pumpGasoline } from '../../src/sim/fuel';
import { FitCache, lookup } from '../../src/sim/simulate';
import { catalogue } from '../support/catalogue';

const k = catalogue.constants;
const cache = new FitCache();
const air = ambientAir({ temperatureC: 25, pressureKPa: 99, relativeHumidity: 0.3 });
const fuel = pumpGasoline(98, k);

function fitFor(carId: string, trimId: string) {
  const { engine, variant } = lookup(catalogue, carId, trimId);
  return cache.get(catalogue, engine, variant, ratingConditions(catalogue, variant));
}

const stockParts: SimBuildSpec = {
  intercooler: 'stock',
  exhaust: 'stock',
  intake: 'stock',
  ecu: 'stock',
  fuel: { kind: 'pump-gasoline', ron: 98 },
  camshafts: 'stock',
};

describe('build model', () => {
  it('a centrifugal kit makes its documented boost at its documented rpm, less below it', () => {
    const fit = fitFor('bmw-3-series-e46', 'usdm-m3-coupe-6mt');
    const boost = 40_000;
    const model = applyBuild(
      fit,
      {
        ...stockParts,
        supercharger: {
          model: 'test kit',
          kind: 'centrifugal',
          boost,
          boostRpm: 7500,
          intercooled: false,
        },
      },
      { air },
      k,
    );
    const run = runDyno(model, { air, fuel }, k);
    const at = (rpm: number) => run.points.find((p) => p.rpm === rpm);
    const top = at(7500);
    const low = at(4000);
    expect(top?.supercharger).toBeDefined();
    expect(Math.abs((top?.boost ?? 0) - boost) / boost).toBeLessThan(0.1);
    // Head rises with tip speed squared: (4000 / 7500)^2 is about 0.28 of the head.
    expect(low?.boost ?? Infinity).toBeLessThan(0.5 * boost);
    expect(low?.boost ?? 0).toBeGreaterThan(0);
  });

  it('a cat-back frees less of the factory exhaust restriction than a turbo-back', () => {
    const fit = fitFor('nissan-silvia-s15', 'jdm-spec-r-6mt');
    const drop = (exhaust: SimBuildSpec['exhaust']) => {
      const model = applyBuild(fit, { ...stockParts, exhaust }, { air }, k);
      if (model.induction.kind !== 'turbo') throw new Error('expected a turbo engine');
      return model.induction.plant.exhaust.pressureDrop;
    };
    const stock = drop('stock');
    expect(drop('cat-back')).toBeLessThan(stock);
    expect(drop('full')).toBeLessThan(drop('cat-back'));
    expect(drop('full')).toBe(Math.min(stock, k['exhaust-back-pressure-turbo-back']));
  });

  it('holds documented gauge boost as an absolute target at the day’s air', () => {
    const fit = fitFor('nissan-silvia-s15', 'jdm-spec-r-6mt');
    const boost = { peak: 82_700, fullBoostRpm: 4000 };
    const model = applyBuild(fit, { ...stockParts, boost }, { air }, k);
    if (model.induction.kind !== 'turbo') throw new Error('expected a turbo engine');
    const target = model.induction.targetPressure;
    model.grid.forEach((rpm, i) => {
      if (rpm >= boost.fullBoostRpm) expect(target[i]).toBeCloseTo(air.pressure + boost.peak, 6);
    });
  });
});
