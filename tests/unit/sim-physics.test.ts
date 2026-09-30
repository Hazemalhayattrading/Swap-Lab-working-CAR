import { describe, expect, it } from 'vitest';
import { intakeVolumePerRevCc } from '../../src/data/displacement';
import { ambientAir, dryAirDensity, saturationVapourPressure } from '../../src/sim/atmosphere';
import { ratingConditions } from '../../src/sim/calibrate/rating';
import { fitStockEngine } from '../../src/sim/calibrate/stock-model';
import {
  knockRetard,
  lambdaWorkFactor,
  retardEfficiency,
  baseIndicatedEfficiency,
} from '../../src/sim/engine/combustion';
import { frictionMep } from '../../src/sim/engine/friction';
import { solvePoint } from '../../src/sim/engine/model';
import { drivetrainFor } from '../../src/sim/drivetrain';
import { runDyno } from '../../src/sim/dyno';
import { pumpGasoline } from '../../src/sim/fuel';
import {
  compressorEfficiency,
  compressorOutletTemperature,
  mapPoint,
  sizeCompressor,
} from '../../src/sim/induction/compressor';
import { solveSupercharger } from '../../src/sim/induction/supercharger';
import { turbineFlow, turbineInletPressure } from '../../src/sim/induction/turbine';
import { applyLimits } from '../../src/sim/limits';
import { omega } from '../../src/sim/math';
import type { SimEngine } from '../../src/data/sim-data';
import { catalogue } from '../support/catalogue';

const k = catalogue.constants;
const engine = (id: string): SimEngine => {
  const e = catalogue.engines.find((x) => x.id === id);
  if (!e) throw new Error(id);
  return e;
};
const variant = (engineId: string, variantId: string) => {
  const v = engine(engineId).variants.find((x) => x.id === variantId);
  if (!v) throw new Error(variantId);
  return v;
};
const stock = (engineId: string, variantId: string) => {
  const v = variant(engineId, variantId);
  return fitStockEngine(engine(engineId), v, ratingConditions(catalogue, v), k);
};

describe('air', () => {
  it('has the dry-air density the standards imply (25 °C, 99 kPa dry: about 1.157 kg/m³)', () => {
    const air = { temperature: 298.15, pressure: 100_000, vapourPressure: 1000 };
    expect(dryAirDensity(air, k)).toBeCloseTo(1.157, 3);
  });

  it('gets saturation vapour pressure right (Buck: 3.17 kPa at 25 °C, 9.59 kPa at 45 °C)', () => {
    expect(saturationVapourPressure(298.15) / 1000).toBeCloseTo(3.17, 2);
    expect(saturationVapourPressure(318.15) / 1000).toBeCloseTo(9.59, 1);
  });

  it('defaults to about 1 kPa of vapour at 45 °C and 10 % humidity', () => {
    const air = ambientAir({ temperatureC: 45, pressureKPa: 101.325, relativeHumidity: 0.1 });
    expect(air.vapourPressure / 1000).toBeCloseTo(0.96, 1);
  });
});

describe('combustion and friction', () => {
  it('peaks work per kilogram of air slightly rich and falls lean with 1/lambda', () => {
    expect(lambdaWorkFactor(1, k)).toBeCloseTo(1, 6);
    expect(lambdaWorkFactor(k['lambda-peak-work'], k)).toBeGreaterThan(lambdaWorkFactor(0.75, k));
    expect(lambdaWorkFactor(1.1, k)).toBeCloseTo(1 / 1.1, 6);
  });

  it('gains about a point of efficiency per point of compression ratio near 10:1', () => {
    const gain = baseIndicatedEfficiency(11, false, k) - baseIndicatedEfficiency(10, false, k);
    expect(gain).toBeGreaterThan(0.005);
    expect(gain).toBeLessThan(0.015);
    expect(baseIndicatedEfficiency(9, true, k)).toBeLessThan(baseIndicatedEfficiency(9, false, k));
  });

  it('costs about 1 % of torque at 6° of retard (MIT) and grows from there', () => {
    expect(1 - retardEfficiency(6, k)).toBeCloseTo(0.0108, 3);
    expect(retardEfficiency(20, k)).toBeLessThan(retardEfficiency(10, k));
    expect(retardEfficiency(0, k)).toBe(1);
  });

  it('retards for a hotter charge or a worse fuel, but never advances a stock map', () => {
    const ref = { retard: 5, chargeTemperature: 320, manifoldPressure: 170_000, ron: 99 };
    const same = { chargeTemperature: 320, manifoldPressure: 170_000, ron: 99 };
    expect(knockRetard(ref, same, k)).toBe(5);
    // 7 K hotter is 1 ON (Russ), so 1° more retard.
    expect(knockRetard(ref, { ...same, chargeTemperature: 327 }, k)).toBeCloseTo(6, 1);
    expect(knockRetard(ref, { ...same, ron: 95 }, k)).toBeCloseTo(9, 6);
    expect(knockRetard(ref, { ...same, ron: 102 }, k)).toBe(5);
  });

  it('rises with mean piston speed', () => {
    const sr20 = engine('sr20det');
    expect(frictionMep(sr20, 7000, k)).toBeGreaterThan(frictionMep(sr20, 3000, k));
  });
});

describe('the rotary convention (src/data/displacement.ts)', () => {
  it('breathes a 13B-REW like a four-stroke of twice its displacement', () => {
    const rotary = engine('13b-rew');
    const fit = stock('13b-rew', 'fd3s-usdm-5mt');
    expect(fit.model.volumePerRev).toBeCloseTo(intakeVolumePerRevCc(rotary) * 1e-6, 12);
    expect(fit.model.volumePerRev).toBeCloseTo(1308e-6, 12);
    const sr20 = stock('sr20de', 's15-jdm');
    expect(sr20.model.volumePerRev).toBeCloseTo(999e-6, 12);
  });
});

describe('compressor map', () => {
  const map = { chokeFlow: 0.3, maxPressureRatio: 2.8, peakEfficiency: 0.7 };

  it('peaks in the middle of the map and falls towards surge and choke', () => {
    const at = (x: number) => {
      const pr = 1 + 0.6 * 1.8;
      const p = mapPoint(map, 0, pr);
      const flow = p.surgeFlow + x * (p.chokeFlow - p.surgeFlow);
      return compressorEfficiency(map, mapPoint(map, flow, pr));
    };
    expect(at(0.55)).toBeCloseTo(0.7, 3);
    expect(at(0.95)).toBeLessThan(at(0.55));
    expect(at(0.05)).toBeLessThan(at(0.55));
  });

  it('heats the air more the less efficient it is', () => {
    const efficient = compressorOutletTemperature(298, 1.8, 0.75, 1.4);
    const poor = compressorOutletTemperature(298, 1.8, 0.55, 1.4);
    expect(efficient).toBeGreaterThan(298);
    expect(poor).toBeGreaterThan(efficient);
  });

  it('sizes a factory compressor so its peak flow sits near choke and nothing surges', () => {
    const points = [
      { corrected: 0.08, pressureRatio: 1.7 },
      { corrected: 0.14, pressureRatio: 1.75 },
      { corrected: 0.2, pressureRatio: 1.7 },
    ];
    const sized = sizeCompressor(points, {
      chokePosition: 0.85,
      pressureRatioFraction: 0.65,
      peakEfficiency: 0.7,
    });
    const xs = points.map((p) => mapPoint(sized, p.corrected, p.pressureRatio).x);
    expect(Math.max(...xs)).toBeCloseTo(0.85, 2);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0.08 - 1e-9);
    expect(sized.compromise).toBe(false);
  });
});

describe('turbine', () => {
  it('inverts its own flow law', () => {
    const t = { flowCapacity: 0.12, efficiency: 0.7 };
    const p3 = turbineInletPressure(t, 0.15, 1150, 115_000);
    expect(turbineFlow(t, p3, 1150, 115_000)).toBeCloseTo(0.15, 9);
    // More flow through the same turbine needs more back pressure.
    expect(turbineInletPressure(t, 0.2, 1150, 115_000)).toBeGreaterThan(p3);
  });
});

describe('turbo engine', () => {
  const fit = stock('sr20det', 's15-jdm');
  const conditions = fit.conditions;

  it('is spool-limited below its full-boost point and holds the target above it', () => {
    const low = solvePoint(fit.model, 2500, conditions, k);
    const high = solvePoint(fit.model, 5500, conditions, k);
    expect(low.turbo?.limit).toBe('spool');
    expect(high.turbo?.limit).toBe('target');
    expect(high.boost).toBeGreaterThan(low.boost);
    expect(high.turbo?.wastegateShare ?? 0).toBeGreaterThan(0);
  });

  it('holds the same boost on a hotter day but makes less power from the hotter, knockier charge', () => {
    const hot = {
      air: ambientAir({ temperatureC: 45, pressureKPa: 101.325, relativeHumidity: 0.1 }),
      fuel: conditions.fuel,
    };
    const ref = solvePoint(fit.model, 5500, conditions, k);
    const warm = solvePoint(fit.model, 5500, hot, k);
    expect(warm.boost).toBeCloseTo(ref.boost, -2);
    expect(warm.chargeTemperature).toBeGreaterThan(ref.chargeTemperature + 15);
    expect(warm.sparkRetard).toBeGreaterThan(ref.sparkRetard);
    expect(warm.torque).toBeLessThan(ref.torque);
  });

  it('estimates a turbine-inlet temperature under the 950 °C limit Ricardo cites', () => {
    const run = runDyno(fit.model, conditions, k);
    const egt = Math.max(...run.points.map((p) => p.exhaustTemperature)) - 273.15;
    expect(egt).toBeGreaterThan(750);
    expect(egt).toBeLessThan(950);
  });

  it('asks for more boost than the stock turbo can give at low rpm without getting it', () => {
    const model = {
      ...fit.model,
      induction: {
        ...(fit.model.induction as Extract<typeof fit.model.induction, { kind: 'turbo' }>),
        targetBoost: fit.model.grid.map(() => 150_000),
      },
    };
    const p = solvePoint(model, 3000, conditions, k);
    expect(p.boost).toBeLessThan(150_000);
    expect(p.turbo?.limit === 'spool' || p.turbo?.limit === 'surge').toBe(true);
  });
});

describe('superchargers', () => {
  const fit = stock('ls3', 'c6-corvette');
  const conditions = fit.conditions;
  const perRev = fit.model.volumePerRev;
  const airflowAt = (rpm: number) => (p: number, t: number) =>
    (((fit.model.ve[30] ?? 0.9) * p) / (k['air-gas-constant'] * t)) * perRev * (rpm / 60);
  const plant = (driveRatio: number) => ({
    charger: {
      kind: 'twin-screw' as const,
      displacementPerRev: 2.3e-3,
      driveRatio,
      volumetricEfficiency: 0.9,
      leakagePerPressureRatio: 0.15,
      adiabaticEfficiency: 0.7,
      driveEfficiency: 0.95,
    },
    intercooler: { effectiveness: 0.75, designFlow: 0.5, pressureDrop: 5000 },
    airFilter: { designFlow: 0.5, pressureDrop: 2500 },
  });

  it('makes more boost with a smaller pulley and costs crank power to drive', () => {
    const slow = solveSupercharger(plant(1.8), 5000, conditions.air, airflowAt(5000), k);
    const fast = solveSupercharger(plant(2.4), 5000, conditions.air, airflowAt(5000), k);
    expect(fast.manifoldPressure).toBeGreaterThan(slow.manifoldPressure);
    expect(slow.manifoldPressure).toBeGreaterThan(conditions.air.pressure);
    expect(fast.drivePower).toBeGreaterThan(slow.drivePower);
  });

  it('builds centrifugal boost with the square of impeller speed', () => {
    const centrifugal = {
      charger: {
        kind: 'centrifugal' as const,
        impellerDiameter: 0.1,
        driveRatio: 12,
        headCoefficient: 0.6,
        map: { chokeFlow: 1.2, maxPressureRatio: 2.6, peakEfficiency: 0.75 },
        driveEfficiency: 0.95,
      },
      intercooler: { effectiveness: 0.7, designFlow: 0.5, pressureDrop: 5000 },
      airFilter: { designFlow: 0.5, pressureDrop: 2500 },
    };
    const at = (rpm: number) =>
      solveSupercharger(centrifugal, rpm, conditions.air, airflowAt(rpm), k).pressureRatio - 1;
    expect(at(6000) / at(3000)).toBeGreaterThan(3);
  });
});

describe('drivetrain', () => {
  const trans = (type: 'manual' | 'automatic' | 'automated-manual', ratios: number[]) => ({
    id: 'x',
    name: 'x',
    type,
    ratios,
  });

  it('pulls in the direct gear and loses more through an automatic', () => {
    const manual = drivetrainFor('FR', trans('manual', [3.6, 2.2, 1.5, 1.2, 1, 0.77]), k);
    const auto = drivetrainFor('FR', trans('automatic', [2.8, 1.5, 1, 0.7]), k);
    expect(manual.gear).toBe(5);
    expect(manual.direct).toBe(true);
    expect(auto.efficiency).toBeLessThan(manual.efficiency);
    // About 15 % crank-to-wheel on a roller dyno for a manual car (Road & Track: 14.9 %).
    expect(1 - manual.efficiency).toBeGreaterThan(0.12);
    expect(1 - manual.efficiency).toBeLessThan(0.18);
  });
});

describe('limits', () => {
  it('holds fuel at the injector duty limit and names it as the bottleneck', () => {
    const fit = stock('sr20det', 's15-jdm');
    const run = runDyno(fit.model, fit.conditions, k);
    const v = variant('sr20det', 's15-jdm');
    const drivetrain = drivetrainFor('FR', { id: 'x', name: 'x', type: 'manual', ratios: [1] }, k);
    const stockLimits = applyLimits(run, { engine: engine('sr20det'), variant: v, drivetrain, k });
    const duty = stockLimits.checks.find((c) => c.id === 'injector-duty');
    expect(duty?.status).toBe('ok');

    // Half the injector flow: the same fuel demand now overruns the limit.
    const small = {
      ...v,
      injectorFlow: { value: (v.injectorFlow?.value ?? 0) / 2, confidence: 'estimated' as const },
    };
    const halved = { ...fit.model, injectors: { count: 4, flow: small.injectorFlow.value } };
    const tight = applyLimits(runDyno(halved, fit.conditions, k), {
      engine: engine('sr20det'),
      variant: small,
      drivetrain,
      k,
    });
    const check = tight.checks.find((c) => c.id === 'injector-duty');
    expect(check?.status).toBe('bottleneck');
    expect(tight.peakPower.value).toBeLessThan(run.peakPower.value);
    expect(Math.max(...tight.points.map((p) => p.injectorDuty ?? 0))).toBeCloseTo(
      k['injector-duty-limit'],
      6,
    );
  });

  it('flags the reported part limits but never pretends to know an unrated clutch', () => {
    const fit = stock('sr20det', 's15-jdm');
    const run = runDyno(fit.model, fit.conditions, k);
    const drivetrain = drivetrainFor('FR', { id: 'x', name: 'x', type: 'manual', ratios: [1] }, k);
    const checks = applyLimits(run, {
      engine: engine('sr20det'),
      variant: variant('sr20det', 's15-jdm'),
      drivetrain,
      k,
    }).checks;
    expect(checks.find((c) => c.id === 'internals')?.status).toBe('ok');
    expect(checks.find((c) => c.id === 'clutch')?.status).toBe('no-data');
    expect(checks.find((c) => c.id === 'cooling')?.status).toBe('not-modelled');
  });
});

describe('torque and power', () => {
  it('are consistent: P = T·ω at every point', () => {
    const fit = stock('vq35hr', 'z33-usdm');
    for (const p of runDyno(fit.model, fit.conditions, k).points) {
      expect(p.power).toBeCloseTo(p.torque * omega(p.rpm), 6);
    }
  });

  it('a lower-octane pump fuel never makes more power than a higher one', () => {
    const fit = stock('2jz-gte', 'jza80-jdm');
    const air = ambientAir({ temperatureC: 45, pressureKPa: 101.325, relativeHumidity: 0.1 });
    const at = (ron: number) =>
      runDyno(fit.model, { air, fuel: pumpGasoline(ron, k) }, k).peakPower.value;
    expect(at(91)).toBeLessThan(at(95));
    expect(at(95)).toBeLessThanOrEqual(at(98));
  });
});
