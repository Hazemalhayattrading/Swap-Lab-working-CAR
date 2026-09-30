import { TO_SI } from '../../data/units';

/**
 * Display units (CLAUDE.md: hp/PS/kW, Nm/lb-ft, bar/psi, °C/°F as the user
 * chooses; defaults hp, Nm, bar, °C). The simulation works in SI.
 */
export type PowerUnit = 'hp' | 'PS' | 'kW';
export type TorqueUnit = 'Nm' | 'lb-ft';
export type PressureUnit = 'bar' | 'psi';
export type TemperatureUnit = '°C' | '°F';

export interface DisplayUnits {
  power: PowerUnit;
  torque: TorqueUnit;
  pressure: PressureUnit;
  temperature: TemperatureUnit;
}

export const DEFAULT_UNITS: DisplayUnits = {
  power: 'hp',
  torque: 'Nm',
  pressure: 'bar',
  temperature: '°C',
};

export const POWER_UNITS: readonly PowerUnit[] = ['hp', 'PS', 'kW'];
export const TORQUE_UNITS: readonly TorqueUnit[] = ['Nm', 'lb-ft'];
export const PRESSURE_UNITS: readonly PressureUnit[] = ['bar', 'psi'];
export const TEMPERATURE_UNITS: readonly TemperatureUnit[] = ['°C', '°F'];

export const powerIn = (watts: number, unit: PowerUnit): number => watts / TO_SI[unit];
export const torqueIn = (nm: number, unit: TorqueUnit): number => nm / TO_SI[unit];
export const pressureIn = (pa: number, unit: PressureUnit): number => pa / TO_SI[unit];
export const temperatureIn = (kelvin: number, unit: TemperatureUnit): number =>
  unit === '°C' ? kelvin - 273.15 : ((kelvin - 273.15) * 9) / 5 + 32;

/** Torque unit as written in running text. */
export const torqueLabel = (unit: TorqueUnit): string => (unit === 'Nm' ? 'N·m' : 'lb-ft');

const grouped = new Intl.NumberFormat('en-US');

/** Keeps a number and its unit on one line. */
export const NBSP = '\u00a0';

/** A number with the given decimals and thousands separators: 6,400 or 1.35. */
export function num(x: number, digits = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(x);
}

export function rpmText(rpm: number): string {
  return `${grouped.format(Math.round(rpm))}${NBSP}rpm`;
}

export function powerText(watts: number, unit: PowerUnit): string {
  return `${num(powerIn(watts, unit))}${NBSP}${unit}`;
}

export function torqueText(nm: number, unit: TorqueUnit): string {
  return `${num(torqueIn(nm, unit))}${NBSP}${torqueLabel(unit)}`;
}

export function pressureText(pa: number, unit: PressureUnit): string {
  return unit === 'bar'
    ? `${num(pa / 1e5, 2)}${NBSP}bar`
    : `${num(pressureIn(pa, unit), 1)}${NBSP}psi`;
}

export function temperatureText(kelvin: number, unit: TemperatureUnit): string {
  return `${num(temperatureIn(kelvin, unit))}${NBSP}${unit}`;
}

/** 0.0314 -> "3.1 %" */
export function percentText(fraction: number, digits = 1): string {
  return `${num(fraction * 100, digits)}${NBSP}%`;
}

/** Rounds up to a "nice" chart step (1, 2, 2.5 or 5 x 10^n). */
export function niceStep(raw: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * exp >= raw) return f * exp;
  return 10 * exp;
}
