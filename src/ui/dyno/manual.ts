import type { CatalogueIndex } from '../../app/sim-protocol';
import type { Confidence, SimAssumption } from '../../data/sim-data';
import { h } from './dom';
import { NBSP, num, temperatureText, type DisplayUnits } from './format';

/**
 * "How we calculate this" (BUILD_PROMPT 6.5): the model in plain language,
 * the rating standards it checks factory figures against, and every model
 * assumption with its confidence and sources.
 */

const CONFIDENCE: Record<Confidence, string> = {
  verified: 'Verified',
  'single-source': 'Single source',
  estimated: 'Estimated',
};

const KINDS: { kind: SimAssumption['kind']; title: string; intro: string }[] = [
  {
    kind: 'physics',
    title: 'Physical constants',
    intro: 'Properties of air, exhaust gas and fuel.',
  },
  {
    kind: 'literature',
    title: 'From published research',
    intro: 'Values taken from engine research, patents and test standards.',
  },
  {
    kind: 'model-choice',
    title: 'Modelling choices',
    intro:
      'Where no source gives a number, the model makes a choice, marked estimated. The stock calibration and, next, the known-build checks are what hold these to account.',
  },
];

function section(title: string, ...body: (HTMLElement | string)[]): HTMLElement {
  return h(
    'section',
    { class: 'manual__section' },
    h('h3', { text: title }),
    ...body.map((b) => (typeof b === 'string' ? h('p', { text: b }) : b)),
  );
}

function standardsTable(index: CatalogueIndex, units: DisplayUnits): HTMLElement {
  return h(
    'table',
    { class: 'manual__table' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { text: 'Standard', attrs: { scope: 'col' } }),
        h('th', { text: 'Reference air', attrs: { scope: 'col' } }),
        h('th', { text: 'Confidence', attrs: { scope: 'col' } }),
      ),
    ),
    h(
      'tbody',
      {},
      ...index.standards.map((s) =>
        h(
          'tr',
          {},
          h('th', { text: s.name, attrs: { scope: 'row' } }),
          h('td', {
            text: `${temperatureText(s.temperature, units.temperature)}, ${num(s.pressure / 1000, 1)} kPa ${
              s.pressureBasis === 'dry-air' ? 'dry air' : 'total'
            }`,
          }),
          h('td', { text: CONFIDENCE[s.confidence] }),
        ),
      ),
    ),
  );
}

function assumptionsTable(assumptions: readonly SimAssumption[]): HTMLElement {
  return h(
    'div',
    { class: 'manual__assumptions' },
    ...KINDS.map(({ kind, title, intro }) => {
      const rows = assumptions.filter((a) => a.kind === kind);
      return h(
        'section',
        { class: 'manual__group' },
        h('h4', { text: title }),
        h('p', { text: intro }),
        h(
          'table',
          { class: 'manual__table manual__table--assumptions' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { text: 'What', attrs: { scope: 'col' } }),
              h('th', { text: 'Value', attrs: { scope: 'col' } }),
              h('th', { text: 'Confidence', attrs: { scope: 'col' } }),
              h('th', { text: 'Sources', attrs: { scope: 'col' } }),
            ),
          ),
          h(
            'tbody',
            {},
            ...rows.map((a) =>
              h(
                'tr',
                { class: `confidence--${a.confidence}` },
                h('th', { text: a.label, attrs: { scope: 'row' } }),
                h('td', { class: 'manual__value', text: a.printed }),
                h('td', { text: CONFIDENCE[a.confidence] }),
                h(
                  'td',
                  {},
                  a.sources.length === 0
                    ? 'None: see the method in the data'
                    : h(
                        'ul',
                        {},
                        ...a.sources.map((s) =>
                          h(
                            'li',
                            {},
                            h('a', {
                              text: s.title,
                              attrs: { href: s.url, target: '_blank', rel: 'noopener noreferrer' },
                            }),
                          ),
                        ),
                      ),
                ),
              ),
            ),
          ),
        ),
      );
    }),
  );
}

export function buildManual(index: CatalogueIndex, units: DisplayUnits): HTMLElement[] {
  const k = (id: SimAssumption['id']) => index.assumptions.find((a) => a.id === id)?.printed ?? '';
  const loss = (id: SimAssumption['id']) => {
    const value = index.assumptions.find((a) => a.id === id)?.value ?? 1;
    return `${num((1 - value) * 100)}${NBSP}%`;
  };
  return [
    section(
      'What the sheet shows',
      'Crank power and torque for the trim you pick, at the ambient temperature and fuel you pick. Solid line: power. Dashed line: torque.',
      'The shaded band is how far off the model could be at each rpm. It is narrowest at the points the maker publishes, wider where the curve between them is the model’s own shape, widest where a turbo is still spooling, and it grows the further your conditions are from the ones the factory figure was rated under.',
      'The dotted lines are the same engine at its factory rating conditions, and the crosses are the factory figures themselves.',
      `Wheel power estimates what a roller chassis dyno would read: crank power less the gearbox (${loss('drivetrain-manual-direct')} for a manual in its direct gear, ${loss('drivetrain-automatic')} for an automatic), the final drive (${loss('drivetrain-final-drive')}) and the tyre on the roller (${loss('drivetrain-tyre-roller')}): about 15 % in all for a manual.`,
    ),
    section(
      'Airflow first',
      'An engine makes torque from the air it can pull in. For every 100 rpm from idle to redline the model works out the mass of air per revolution: swept volume, times how well the engine fills it (volumetric efficiency), times the density of the air.',
      'A four-stroke piston engine fills each cylinder once every two revolutions. A rotary makes one intake stroke per rotor for every turn of its eccentric shaft, so the 1.3-litre 13B takes in 1.3 litres of air per shaft turn and the 2.0-litre 20B 2.0 litres.',
      'Fuel is added to match, rich at full throttle as factory maps run, and the energy in that fuel times the engine’s efficiency gives torque. Friction and pumping losses come off last. Hot air is thinner, so a 45 °C day costs power before anything else happens.',
    ),
    section(
      'Boost',
      'A turbo engine gets a compressor map (how much air the compressor moves at each pressure ratio, and how efficiently) and a turbine that has to find the energy to drive it. Below the spool point the turbine can’t hold the target boost yet; above it the wastegate opens. If the compressor reaches surge, choke or its speed limit, the sheet names it.',
      'Sequential twins (2JZ-GTE, 13B-REW, 20B-REW) run on one turbo up to the changeover rpm, then on both. Factory compressor maps aren’t public, so each stock turbo is sized to its own engine’s rated output and, where it is published, its boost.',
      'Compressed air comes out hot; the intercooler takes most of that heat away, and what is left reaches the cylinders.',
    ),
    section(
      'Heat, octane and knock',
      `Hotter charge air and lower octane push an engine towards knock, so its ECU takes ignition timing away, and that costs torque. The model compares your conditions with the rating’s: about one degree of timing for every octane number less, or every 7 °C of extra charge-air temperature (${k('knock-octane-per-kelvin')}). It never adds timing beyond the factory map, so a fuel better than the one the car was rated on gains nothing here.`,
    ),
    section(
      'Stock calibration: why some numbers are hidden',
      'Before a trim shows any numbers, the model has to reproduce its factory figures: peak power and peak torque within 3 %, each at the right rpm within 250 rpm, and every point of Nissan Europe’s published 350Z torque curves within 3 %.',
      'Each factory figure is checked under its own rating standard, on the fuel its market rated on. Where the maker doesn’t print the standard, the usual one for that market and year is assumed, and the band is widened.',
      standardsTable(index, units),
      'The calibration fits each engine’s breathing, and for a turbo engine its turbo, to those figures, inside physical limits. A pass shows the model reproduces the stock engine. It doesn’t yet show the model predicts a modified one: checking it against documented real builds, within 10 %, is the next step.',
    ),
    section(
      'Limits',
      `Some limits cap the curve where they bind: injectors past ${k('injector-duty-limit')} duty (the tune holds the fuel there), and a compressor at surge, choke or its speed limit. Part ratings (rods and pistons, clutch, gearbox, diff and axles) are flagged when a build exceeds them but don’t bend the curve. Most stock parts have no rating on file yet; the parts catalogue adds them.`,
    ),
    section(
      'Not in the model yet',
      'The thermal model (heat soak, radiator and oil-cooler capacity), the fuel model (race fuel, E85 and each car’s own rating fuel) and the known-build checks come next.',
    ),
    section(
      'Every assumption',
      'Each number the model uses that isn’t a car’s own data, with how sure we are and where it comes from.',
      assumptionsTable(index.assumptions),
    ),
  ];
}
