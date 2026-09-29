import { describe, expect, it } from 'vitest';
import { REQUIRED_SWAP_SLOTS, SwapSchema } from '../../src/data/schema/swap';
import { validateData, type FileFacts } from '../../src/data/validate';

const src = (url: string) => ({ url, accessed: '2026-09-29' });
const one = { confidence: 'single-source', sources: [src('https://vendor.example.com/p')] };
const s = <T>(value: T, unit?: string) => ({ value, ...(unit ? { unit } : {}), ...one });

function part(id: string, fills: string[], over: Record<string, unknown> = {}) {
  return { id, vendor: 'Example Fab', product: s(`${id} product`), fills, ...over };
}

/** A complete swap: a kit covering mounts and headers, plus one part per remaining slot. */
function swap(over: Record<string, unknown> = {}) {
  return {
    id: 'nissan-silvia-s15--gm-ls',
    car: 'nissan-silvia-s15',
    engines: ['ls1', 'ls3'],
    parts: [
      part('mount-kit', ['engine-mounts', 'transmission-mount', 'headers'], {
        price: s(1299.99, 'USD'),
        partNumber: s('EX-S14-LS'),
        includes: s(['engine mounts', 'T56 crossmember', 'long-tube headers']),
        requires: s(['F-body oil pan']),
        pairsWith: ['f-body-pan'],
      }),
      part('t56', ['gearbox']),
      part('f-body-pan', ['oil-pan']),
      part('ecu-24x', ['ecu', 'wiring-harness'], { engines: ['ls1'] }),
      part('ecu-58x', ['ecu', 'wiring-harness'], { engines: ['ls3'] }),
    ],
    fitment: [s('The S14 front suspension member also fits the S15.')],
    modifications: [s('No cutting of the firewall is needed.')],
    ...over,
  };
}

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => i.message).join('\n');

describe('SwapSchema', () => {
  it('accepts a swap whose parts fill every required slot, a kit filling several', () => {
    expect(messages(SwapSchema.safeParse(swap()))).toBe('');
  });

  it('needs mounts, gearbox or adapter, sump, wiring and ECU (BUILD_PROMPT section 3)', () => {
    expect(REQUIRED_SWAP_SLOTS).toEqual([
      'engine-mounts',
      'gearbox',
      'oil-pan',
      'wiring-harness',
      'ecu',
    ]);
    const r = SwapSchema.safeParse(swap({ parts: [part('t56', ['gearbox'])] }));
    for (const slot of ['engine-mounts', 'oil-pan', 'wiring-harness', 'ecu']) {
      expect(messages(r)).toContain(`No part fills the "${slot}" slot`);
    }
    expect(messages(r)).not.toContain('"gearbox"');
  });

  it('rejects duplicate part ids, pairings with missing parts and engines outside the swap', () => {
    const base = swap().parts;
    const dup = SwapSchema.safeParse(swap({ parts: [...base, part('t56', ['gearbox'])] }));
    expect(messages(dup)).toContain('Duplicate part id "t56".');
    const pair = SwapSchema.safeParse(
      swap({ parts: [...base, part('pan-2', ['oil-pan'], { pairsWith: ['nope', 'pan-2'] })] }),
    );
    expect(messages(pair)).toContain('No other part "nope" in this swap.');
    expect(messages(pair)).toContain('No other part "pan-2" in this swap.');
    const engine = SwapSchema.safeParse(
      swap({ parts: [...base, part('ecu-ls7', ['ecu'], { engines: ['ls7'] })] }),
    );
    expect(messages(engine)).toContain('"ls7" is not one of this swap\'s engines');
  });

  it('needs a known slot, a listed currency and a sourced product name', () => {
    const base = swap().parts;
    expect(SwapSchema.safeParse(swap({ parts: [...base, part('x', ['turbo'])] })).success).toBe(
      false,
    );
    expect(
      SwapSchema.safeParse(
        swap({ parts: [...base, part('x', ['other'], { price: s(10, 'BTC') })] }),
      ).success,
    ).toBe(false);
    expect(
      SwapSchema.safeParse(
        swap({ parts: [...base, { ...part('x', ['other']), product: 'Unsourced name' }] }),
      ).success,
    ).toBe(false);
  });
});

describe('validateData: swaps', () => {
  const facts: FileFacts = {
    sizeOf: () => undefined,
    dependencyVersion: () => undefined,
    dependencies: [],
    publicFiles: [],
    sourceAssetFiles: [],
  };
  const v = <T>(value: T, unit?: string) => ({
    value,
    ...(unit ? { unit } : {}),
    confidence: 'verified',
    sources: [src('https://a.example.com'), src('https://b.org')],
  });
  /** Minimal valid engine: stock-only unless told otherwise (launch swaps need more fields). */
  const engine = (id: string, role: 'launch-swap' | 'stock-only') => ({
    id,
    code: id.toUpperCase(),
    manufacturer: 'General Motors',
    family: 'LS',
    role,
    layout: 'V',
    cylinders: 8,
    displacement: v(5665, 'cc'),
    bore: v(99, 'mm'),
    stroke: v(92, 'mm'),
    camLayout: v('OHV'),
    valvesPerCylinder: v(2),
    camDrive: v('chain'),
    blockMaterial: v('aluminium'),
    headMaterial: v('aluminium'),
    firingOrder: v([1, 8, 7, 2, 6, 5, 4, 3]),
    fuelInjection: v('port'),
    ...(role === 'launch-swap'
      ? {
          dryWeight: v(210, 'kg'),
          dimensions: { length: v(700, 'mm'), width: v(700, 'mm'), height: v(700, 'mm') },
          bellhousing: v('gm-ls'),
          sump: v('rear'),
          internals: {
            crank: v('cast'),
            rods: v('powdered-metal'),
            pistons: v('cast'),
            reportedLimits: [],
          },
        }
      : {}),
    variants: [
      {
        id: 'c5',
        name: 'C5 Corvette',
        markets: ['USDM'],
        period: v({ from: '1997', to: '2000' }),
        fittedTo: ['C5'],
        compressionRatio: v(10.1),
        induction: v('naturally-aspirated'),
        intercooler: v('none'),
        variableValveTiming: v('none'),
        output: {
          power: v(345, 'hp'),
          powerRpm: v(5600, 'rpm'),
          torque: v(350, 'lb-ft'),
          torqueRpm: v(4400, 'rpm'),
          standard: 'SAE-net',
        },
      },
    ],
  });
  const s15 = {
    id: 'nissan-silvia-s15',
    make: 'Nissan',
    model: 'Silvia',
    chassis: 'S15',
    layout: 'FR',
    production: v({ from: '1999-01', to: '2002-08' }),
    dimensions: {
      length: v(4445, 'mm'),
      width: v(1695, 'mm'),
      height: v(1285, 'mm'),
      wheelbase: v(2525, 'mm'),
      trackFront: v(1480, 'mm'),
      trackRear: v(1470, 'mm'),
    },
    transmissions: [
      {
        id: 's15-6mt',
        name: '6-speed manual',
        type: 'manual',
        gears: 6,
        ratios: v([3.321, 1.902, 1.308, 1.0, 0.759, 0.63]),
      },
    ],
    trims: [
      {
        id: 'jdm-spec-r-6mt',
        name: 'Spec-R',
        market: 'JDM',
        period: v({ from: '1999-01', to: '2002-08' }),
        bodyStyle: 'coupe',
        engine: { id: 'ls1', variant: 'c5' },
        transmission: 's15-6mt',
        finalDrive: v(3.692),
        differential: v('helical-lsd'),
        curbWeight: v(1240, 'kg'),
        tyres: { front: v('215/45R17'), rear: v('215/45R17') },
      },
    ],
    geometry: { status: 'pending-model', plan: 'Measure from the licensed model in Phase 4.' },
  };
  const files = (swapJson: unknown, swapFile = 'nissan-silvia-s15--gm-ls') => [
    { path: `src/data/swaps/${swapFile}.json`, json: swapJson },
    { path: 'src/data/engines/ls1.json', json: engine('ls1', 'launch-swap') },
    { path: 'src/data/engines/ls3.json', json: engine('ls3', 'launch-swap') },
    { path: 'src/data/engines/lq4.json', json: engine('lq4', 'stock-only') },
  ];
  const issues = (json: unknown, swapFile?: string) =>
    validateData(files(json, swapFile), facts).issues.map((i) => i.message);

  it('flags a swap for a car with no car file', () => {
    // No car files are loaded here, so the S15 reference can't resolve.
    expect(issues(swap())).toEqual(['No car file for "nissan-silvia-s15".']);
  });

  it('flags unknown and stock-only engines, and an id that does not match the file', () => {
    const found = issues(
      swap({ engines: ['ls1', 'lq4', 'ls9'], parts: swap().parts.slice(0, 4) }),
      'x',
    );
    expect(found).toContain('id "nissan-silvia-s15--gm-ls" must match the file name.');
    expect(found).toContain('"lq4" is a stock-only engine; swaps are for launch-swap engines.');
    expect(found).toContain('No engine file for "ls9".');
  });

  it("checks a kept gearbox against the car file's transmissions", () => {
    const withCar = (json: unknown) => [
      ...files(json),
      { path: 'src/data/cars/nissan-silvia-s15.json', json: s15 },
    ];
    const kept = (ids: string[]) =>
      swap({ parts: [...swap().parts, part('fs6r92a', ['gearbox'], { carGearbox: ids })] });
    expect(validateData(withCar(kept(['s15-6mt'])), facts).issues).toEqual([]);
    expect(validateData(withCar(kept(['t56'])), facts).issues.map((i) => i.message)).toEqual([
      'Car "nissan-silvia-s15" has no transmission "t56".',
    ]);
  });

  it('counts the confidence of swap values like any other data', () => {
    const report = validateData(files(swap()), facts);
    expect(report.counts['value single-source']).toBeGreaterThan(8);
  });
});
