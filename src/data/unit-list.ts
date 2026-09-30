/**
 * Units a data file may use, per quantity. The loader converts them to SI
 * (src/data/units.ts). No imports, so the page can share the conversion
 * factors without pulling in the Zod schemas.
 */
export const UNITS = {
  power: ['PS', 'hp', 'kW'],
  torque: ['Nm', 'kgf·m', 'lb-ft'],
  mass: ['kg', 'lb'],
  length: ['mm', 'in'],
  elevation: ['m', 'ft'],
  displacement: ['cc'],
  pressure: ['bar', 'kPa', 'psi', 'kgf/cm²', 'hPa', 'mbar', 'inHg'],
  speed: ['rpm'],
  roadSpeed: ['km/h', 'mph'],
  flow: ['cc/min'],
  massFlow: ['lb/min', 'kg/s'],
  angle: ['deg'],
  volume: ['L'],
  time: ['s'],
  energyDensity: ['MJ/kg'],
  latentHeat: ['kJ/kg'],
  density: ['kg/m³', 'kg/L'],
} as const;
