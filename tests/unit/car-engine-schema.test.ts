import { describe, expect, it } from 'vitest';
import { CarSchema } from '../../src/data/schema/car';
import { EngineSchema } from '../../src/data/schema/engine';
import { validateData, type FileFacts } from '../../src/data/validate';

const src = (url: string) => ({ url, accessed: '2026-09-26' });
const verified = {
  confidence: 'verified',
  sources: [src('https://a.example.com'), src('https://b.org')],
};
const one = { confidence: 'single-source', sources: [src('https://a.example.com')] };
const v = <T>(value: T, unit?: string) => ({ value, ...(unit ? { unit } : {}), ...verified });

function engine(over: Record<string, unknown> = {}) {
  return {
    id: 'sr20det',
    code: 'SR20DET',
    manufacturer: 'Nissan',
    family: 'SR',
    role: 'stock-only',
    layout: 'inline',
    cylinders: 4,
    displacement: v(1998, 'cc'),
    bore: v(86, 'mm'),
    stroke: v(86, 'mm'),
    camLayout: v('DOHC'),
    valvesPerCylinder: v(4),
    camDrive: v('chain'),
    blockMaterial: v('cast-iron'),
    headMaterial: v('aluminium'),
    firingOrder: v([1, 3, 4, 2]),
    fuelInjection: v('port'),
    variants: [variant()],
    ...over,
  };
}

function variant(over: Record<string, unknown> = {}) {
  return {
    id: 's15-jdm',
    name: 'S15 Spec-R',
    markets: ['JDM'],
    period: v({ from: '1999-01', to: '2002-08' }),
    fittedTo: ['S15'],
    compressionRatio: v(8.5),
    induction: v('single-turbo'),
    turbos: [{ model: { value: 'Example T28', ...one }, count: 1 }],
    intercooler: v('air-to-air-front'),
    variableValveTiming: v('intake-on-off'),
    output: {
      power: v(250, 'PS'),
      powerRpm: v(6400, 'rpm'),
      torque: v(28, 'kgf·m'),
      torqueRpm: v(4800, 'rpm'),
      standard: 'JIS-net',
    },
    ...over,
  };
}

/** A 13B-REW-like rotary: rotors and ports instead of cylinders and valves. */
function rotary(over: Record<string, unknown> = {}) {
  const deg = (value: number) => v(value, 'deg');
  return {
    id: '13b-rew',
    code: '13B-REW',
    manufacturer: 'Mazda',
    family: '13B',
    role: 'stock-only',
    layout: 'rotary',
    rotors: 2,
    displacement: v(1308, 'cc'),
    rotor: {
      generatingRadius: v(105, 'mm'),
      eccentricity: v(15, 'mm'),
      width: v(80, 'mm'),
      chamberDisplacement: v(654, 'cc'),
    },
    ports: {
      intake: [
        {
          name: 'primary',
          location: v('side'),
          opens: { ref: 'BTDC', angle: deg(45) },
          closes: { ref: 'ABDC', angle: deg(50) },
        },
      ],
      exhaust: {
        location: v('peripheral'),
        opens: { ref: 'BBDC', angle: deg(75) },
        closes: { ref: 'ATDC', angle: deg(48) },
      },
    },
    sparkPlugsPerRotor: v(2),
    firingOrder: v([1, 2]),
    fuelInjection: v('port'),
    materials: {
      rotorHousing: v('aluminium'),
      sideHousings: v('cast-iron'),
      rotors: v('cast-iron'),
    },
    variants: [rotaryVariant()],
    ...over,
  };
}

function rotaryVariant(over: Record<string, unknown> = {}) {
  const { variableValveTiming: _vvt, ...pistonOnlyRemoved } = variant();
  return {
    ...pistonOnlyRemoved,
    id: 'fd3s-jdm',
    name: 'FD3S',
    fittedTo: ['FD3S'],
    compressionRatio: v(9.0),
    induction: v('twin-turbo-sequential'),
    turbos: [{ model: { value: 'Example HT12', ...one }, count: 2 }],
    injectorFlow: v(550, 'cc/min'),
    secondaryInjectorFlow: v(850, 'cc/min'),
    ...over,
  };
}

function car(over: Record<string, unknown> = {}) {
  return {
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
        id: 'six-speed',
        name: '6-speed manual',
        type: 'manual',
        gears: 6,
        ratios: v([3.3, 2.1, 1.5, 1.2, 1.0, 0.8]),
      },
    ],
    trims: [trim()],
    geometry: { status: 'pending-model', plan: 'Measure from the licensed model in Phase 4.' },
    ...over,
  };
}

function trim(over: Record<string, unknown> = {}) {
  return {
    id: 'jdm-spec-r-6mt',
    name: 'Spec-R',
    market: 'JDM',
    period: v({ from: '1999-01', to: '2002-08' }),
    bodyStyle: 'coupe',
    engine: { id: 'sr20det', variant: 's15-jdm' },
    transmission: 'six-speed',
    finalDrive: v(4.1),
    differential: v('helical-lsd'),
    curbWeight: v(1250, 'kg'),
    tyres: { front: v('205/55R16'), rear: v('205/55R16') },
    ...over,
  };
}

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => i.message).join('\n');

describe('EngineSchema', () => {
  it('accepts a complete stock-only engine', () => {
    const r = EngineSchema.safeParse(engine());
    expect(messages(r)).toBe('');
  });

  it('requires swap hardware on launch-swap engines', () => {
    const r = EngineSchema.safeParse(engine({ role: 'launch-swap' }));
    expect(messages(r)).toMatch(/Launch-swap engines need `dryWeight`/);
    expect(messages(r)).toMatch(/`internals`/);
  });

  it('rejects a firing order that skips or repeats a cylinder', () => {
    expect(EngineSchema.safeParse(engine({ firingOrder: v([1, 3, 3, 2]) })).success).toBe(false);
  });

  it('rejects a unit that does not belong to the quantity', () => {
    const r = EngineSchema.safeParse(engine({ displacement: v(1998, 'kg') }));
    expect(r.success).toBe(false);
  });

  it('keeps turbo and NA variants consistent', () => {
    expect(
      EngineSchema.safeParse(engine({ variants: [variant({ turbos: undefined })] })).success,
    ).toBe(false);
    expect(
      EngineSchema.safeParse(
        engine({ variants: [variant({ induction: v('naturally-aspirated') })] }),
      ).success,
    ).toBe(false);
  });

  it('rejects duplicate variant ids', () => {
    expect(EngineSchema.safeParse(engine({ variants: [variant(), variant()] })).success).toBe(
      false,
    );
  });

  it('accepts cam phasing on both camshafts (double VANOS, CVTCS + eCVTCS)', () => {
    const r = EngineSchema.safeParse(
      engine({
        variants: [
          variant({
            induction: v('naturally-aspirated'),
            turbos: undefined,
            intercooler: v('none'),
            variableValveTiming: v('intake-and-exhaust-continuous'),
          }),
        ],
      }),
    );
    expect(messages(r)).toBe('');
  });

  it('accepts a published torque curve and rejects unsorted or unit-less ones', () => {
    const curve = (value: unknown, unit?: string) =>
      EngineSchema.safeParse(
        engine({ variants: [variant({ torqueCurve: { ...v(value, unit) } })] }),
      );
    const points = [
      [2000, 314],
      [4800, 363],
      [6600, 288],
    ];
    expect(messages(curve(points, 'Nm'))).toBe('');
    expect(messages(curve([points[1], points[0], points[2]], 'Nm'))).toContain('rising rpm');
    expect(messages(curve(points))).toContain('Torque curve needs a unit');
    expect(curve(points.slice(0, 2), 'Nm').success).toBe(false);
  });

  it('rejects a "verified" rating backed by one site', () => {
    const output = {
      ...variant().output,
      power: { value: 250, unit: 'PS', ...one, confidence: 'verified' },
    };
    expect(EngineSchema.safeParse(engine({ variants: [variant({ output })] })).success).toBe(false);
  });
});

describe('EngineSchema: rotaries', () => {
  it('accepts a rotary with rotor geometry, ports and staged injectors', () => {
    expect(messages(EngineSchema.safeParse(rotary()))).toBe('');
  });

  it('keeps piston and rotary fields apart', () => {
    expect(messages(EngineSchema.safeParse(rotary({ bore: v(86, 'mm') })))).toMatch(
      /Unrecognized key/,
    );
    expect(messages(EngineSchema.safeParse(engine({ rotors: 2 })))).toMatch(/Unrecognized key/);
    const withCams = rotary({
      variants: [rotaryVariant({ variableValveTiming: v('none') })],
    });
    expect(messages(EngineSchema.safeParse(withCams))).toMatch(/Unrecognized key/);
  });

  it("stores the maker's displacement, not a doubled or tax-class figure", () => {
    expect(messages(EngineSchema.safeParse(rotary({ displacement: v(2616, 'cc') })))).toMatch(
      /rotors x chamber displacement/,
    );
    expect(messages(EngineSchema.safeParse(rotary({ displacement: v(1962, 'cc') })))).toMatch(
      /rotors x chamber displacement/,
    );
  });

  it('checks the chamber displacement against 3·√3·R·e·B', () => {
    const rotor = { ...rotary().rotor, eccentricity: v(17.5, 'mm') };
    expect(messages(EngineSchema.safeParse(rotary({ rotor })))).toMatch(/3·√3·R·e·B/);
  });

  it('checks the firing order lists every rotor once', () => {
    expect(messages(EngineSchema.safeParse(rotary({ firingOrder: v([1, 1]) })))).toMatch(
      /list rotors 1-2 once each/,
    );
  });

  it('needs the primary injectors when there are secondaries', () => {
    const variants = [rotaryVariant({ injectorFlow: undefined })];
    expect(messages(EngineSchema.safeParse(rotary({ variants })))).toMatch(/primary injector/);
  });

  it('requires swap hardware on a launch-swap rotary and rotary limit components', () => {
    expect(messages(EngineSchema.safeParse(rotary({ role: 'launch-swap' })))).toMatch(
      /`internals`/,
    );
    const limit = (component: string) => ({
      component,
      quantity: 'wheel-power',
      value: v(400, 'hp'),
      context: 'Tuner guidance, pump fuel.',
    });
    const internals = (component: string) => ({
      eccentricShaft: v('forged'),
      apexSeals: v('two-piece cast iron'),
      reportedLimits: [limit(component)],
    });
    expect(messages(EngineSchema.safeParse(rotary({ internals: internals('apex-seals') })))).toBe(
      '',
    );
    expect(EngineSchema.safeParse(rotary({ internals: internals('rods') })).success).toBe(false);
  });
});

describe('CarSchema', () => {
  it('accepts a complete car', () => {
    expect(messages(CarSchema.safeParse(car()))).toBe('');
  });

  it('checks the gearbox has as many ratios as gears', () => {
    const transmissions = [{ ...car().transmissions[0], gears: 5 }];
    expect(CarSchema.safeParse(car({ transmissions })).success).toBe(false);
  });

  it('rejects a trim that points at an unknown gearbox', () => {
    const r = CarSchema.safeParse(car({ trims: [trim({ transmission: 'a340e' })] }));
    expect(messages(r)).toMatch(/Unknown transmission "a340e"/);
  });

  it('rejects a trim sold outside the production period', () => {
    const r = CarSchema.safeParse(
      car({ trims: [trim({ period: v({ from: '1998-06', to: '2002-08' }) })] }),
    );
    expect(messages(r)).toMatch(/outside the car/);
  });

  it('accepts year-only periods against month periods', () => {
    const r = CarSchema.safeParse(
      car({ trims: [trim({ period: v({ from: '1999', to: '2002' }) })] }),
    );
    expect(messages(r)).toBe('');
  });

  it('compares a period’s ends at the precision both share', () => {
    // RX-7 SP: sources give April 1995 as the start but only the year it ended.
    const ok = CarSchema.safeParse(
      car({ trims: [trim({ period: v({ from: '1999-04', to: '1999' }) })] }),
    );
    expect(messages(ok)).toBe('');
    const bad = CarSchema.safeParse(
      car({ trims: [trim({ period: v({ from: '2000-04', to: '1999' }) })] }),
    );
    expect(messages(bad)).toMatch(/after/);
  });

  it('accepts automated-manual gearboxes, wagons and speed-sensing clutch LSDs', () => {
    const transmissions = [
      { ...car().transmissions[0], id: 'smg', name: '6-speed SMG II', type: 'automated-manual' },
    ];
    const trims = [
      trim({
        transmission: 'smg',
        bodyStyle: 'wagon',
        differential: v('speed-sensing-clutch-lsd'),
      }),
    ];
    expect(messages(CarSchema.safeParse(car({ transmissions, trims })))).toBe('');
  });

  it('accepts a seat count where grades differ (2-seat Spirit R Type A)', () => {
    expect(messages(CarSchema.safeParse(car({ trims: [trim({ seats: v(2) })] })))).toBe('');
    expect(CarSchema.safeParse(car({ trims: [trim({ seats: v(0) })] })).success).toBe(false);
  });

  it('rejects malformed tyre sizes', () => {
    const r = CarSchema.safeParse(
      car({ trims: [trim({ tyres: { front: v('205-55-16'), rear: v('205/55R16') } })] }),
    );
    expect(r.success).toBe(false);
  });

  it('does not accept invented geometry: measured geometry needs sourced points', () => {
    expect(CarSchema.safeParse(car({ geometry: { status: 'measured' } })).success).toBe(false);
  });
});

describe('validateData cross-file checks', () => {
  const facts: FileFacts = {
    sizeOf: () => undefined,
    dependencyVersion: () => undefined,
    dependencies: [],
    publicFiles: [],
    sourceAssetFiles: [],
  };
  const files = (carJson: unknown, engineJson: unknown, enginePath = 'sr20det') => [
    { path: 'src/data/cars/nissan-silvia-s15.json', json: carJson },
    { path: `src/data/engines/${enginePath}.json`, json: engineJson },
  ];

  it('passes when trims point at real engine variants', () => {
    const report = validateData(files(car(), engine()), facts);
    expect(report.issues).toEqual([]);
    expect(report.counts['value verified']).toBeGreaterThan(20);
    expect(report.counts['value single-source']).toBe(1);
  });

  it('flags a missing engine file or variant', () => {
    const noVariant = validateData(
      files(car({ trims: [trim({ engine: { id: 'sr20det', variant: 's14-jdm' } })] }), engine()),
      facts,
    );
    expect(noVariant.issues.map((i) => i.message)).toContain(
      'Engine "sr20det" has no variant "s14-jdm".',
    );
    const noEngine = validateData(
      files(car({ trims: [trim({ engine: { id: '2jz-gte', variant: 'x' } })] }), engine()),
      facts,
    );
    expect(noEngine.issues.map((i) => i.message)).toContain('No engine file for "2jz-gte".');
  });

  it('flags an id that does not match its file name', () => {
    const report = validateData(files(car(), engine(), 'sr20de'), facts);
    expect(report.issues.map((i) => i.message)).toContain('id "sr20det" must match the file name.');
  });

  it('lists every estimated value by path', () => {
    const estimated = {
      value: 180,
      unit: 'kg',
      confidence: 'estimated',
      sources: [],
      method: 'Derived from the S14 figure plus the ball-bearing turbo.',
    };
    const report = validateData(files(car(), engine({ dryWeight: estimated })), facts);
    expect(report.issues).toEqual([]);
    expect(report.estimated).toEqual(['src/data/engines/sr20det.json.dryWeight']);
  });
});
