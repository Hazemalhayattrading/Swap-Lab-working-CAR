import type { SimVariant } from '../../data/sim-data';
import type { DynoRun } from '../dyno';
import { interpolate } from '../math';
import type { StockFit } from './stock-model';

/**
 * The stock calibration gate (BUILD_PROMPT 6.5, CLAUDE.md rule 3): at the
 * figure's own rating conditions the model must land within 3 % of the
 * factory peak power and torque, with each peak's rpm within 250 rpm, and
 * within 3 % of every point of a published torque curve. The model's inferred
 * breathing must also stay physically plausible, so a fit can't pass by
 * inventing an impossible engine.
 */
export const TOLERANCE = { value: 0.03, rpm: 250 } as const;

/** Physical bounds on what the calibration may infer. */
export const PLAUSIBLE = {
  /** Volumetric efficiency anywhere in the sweep. */
  ve: [0.45, 1.25],
  /** Level of a turbo engine's VE curve where the boost is published. */
  veLevel: [0.7, 1.15],
  /** Stock boost the model infers where none is published, Pa gauge. */
  inferredBoost: [20_000, 130_000],
} as const;

export interface PeakCheck {
  factory: number;
  model: number;
  /** (model - factory) / factory */
  error: number;
  factoryRpm: number;
  modelRpm: number;
}

export interface StockCheck {
  pass: boolean;
  torque: PeakCheck;
  power: PeakCheck;
  /** Every point of a published torque curve. */
  curve?: { rpm: number; factory: number; model: number; error: number }[];
  /** Why it failed, in plain words (empty when it passes). */
  failures: string[];
  plausibility: { veMin: number; veMax: number; boostPeak?: number; veLevel?: number };
}

export function checkStock(fit: StockFit, variant: SimVariant, run: DynoRun): StockCheck {
  const failures: string[] = [];
  const r = variant.rating;
  const peak = (factory: number, factoryRpm: number, model: number, modelRpm: number) => ({
    factory,
    model,
    error: (model - factory) / factory,
    factoryRpm,
    modelRpm,
  });
  const torque = peak(r.torque.value, r.torqueRpm.value, run.peakTorque.value, run.peakTorque.rpm);
  const power = peak(r.power.value, r.powerRpm.value, run.peakPower.value, run.peakPower.rpm);
  for (const [name, p] of [
    ['Peak torque', torque],
    ['Peak power', power],
  ] as const) {
    if (Math.abs(p.error) > TOLERANCE.value) {
      failures.push(`${name} is ${(p.error * 100).toFixed(1)} % off the factory figure.`);
    }
    if (Math.abs(p.modelRpm - p.factoryRpm) > TOLERANCE.rpm) {
      failures.push(
        `${name} comes at ${String(p.modelRpm)} rpm, not within 250 rpm of ${String(p.factoryRpm)}.`,
      );
    }
  }

  let curve: StockCheck['curve'];
  if (variant.torqueCurve) {
    const rpms = run.points.map((p) => p.rpm);
    const torques = run.points.map((p) => p.torque);
    curve = variant.torqueCurve.map((pt) => {
      const model = interpolate(rpms, torques, pt.rpm);
      return { rpm: pt.rpm, factory: pt.torque, model, error: (model - pt.torque) / pt.torque };
    });
    for (const c of curve) {
      if (Math.abs(c.error) > TOLERANCE.value) {
        failures.push(
          `Torque at ${String(c.rpm)} rpm is ${(c.error * 100).toFixed(1)} % off the published curve.`,
        );
      }
    }
  }

  const ve = run.points.map((p) => p.volumetricEfficiency);
  const veMin = Math.min(...ve);
  const veMax = Math.max(...ve);
  if (veMin < PLAUSIBLE.ve[0] || veMax > PLAUSIBLE.ve[1]) {
    failures.push(
      `The fitted volumetric efficiency runs ${veMin.toFixed(2)}-${veMax.toFixed(2)}, outside ${String(PLAUSIBLE.ve[0])}-${String(PLAUSIBLE.ve[1])}.`,
    );
  }
  if (fit.boost?.source === 'published') {
    const [lo, hi] = PLAUSIBLE.veLevel;
    if (fit.boost.veLevel < lo || fit.boost.veLevel > hi) {
      failures.push(
        `Matching the published boost needs a VE level of ${fit.boost.veLevel.toFixed(2)}, outside ${String(lo)}-${String(hi)}.`,
      );
    }
  }
  if (fit.boost?.source === 'inferred') {
    const [lo, hi] = PLAUSIBLE.inferredBoost;
    if (fit.boost.peak < lo || fit.boost.peak > hi) {
      failures.push(
        `The inferred stock boost, ${(fit.boost.peak / 1e5).toFixed(2)} bar, is outside ${String(lo / 1e5)}-${String(hi / 1e5)} bar.`,
      );
    }
  }

  return {
    pass: failures.length === 0,
    torque,
    power,
    ...(curve ? { curve } : {}),
    failures,
    plausibility: {
      veMin,
      veMax,
      ...(fit.boost ? { boostPeak: fit.boost.peak, veLevel: fit.boost.veLevel } : {}),
    },
  };
}
