import type { KnownBuildTable } from '../../app/sim-client';
import type { CatalogueIndex } from '../../app/sim-protocol';
import type { Confidence, SimAssumption } from '../../data/sim-data';
import { h } from './dom';
import { NBSP, num, percentText, powerText, temperatureText, type DisplayUnits } from './format';

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
      'Where no source gives a number, the model makes a choice, marked estimated. The stock calibration and the known-build checks are what hold these to account.',
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

function signed(fraction: number): string {
  return `${fraction >= 0 ? '+' : '−'}${percentText(Math.abs(fraction))}`;
}

/** The known-build table: filled in when the worker has run every build. */
function knownBuildsTable(table: Promise<KnownBuildTable>, units: DisplayUnits): HTMLElement {
  const host = h('div', { class: 'manual__builds' }, h('p', { text: 'Running the known builds.' }));
  table.then(
    ({ builds, tolerance }) => {
      const cars = [...new Set(builds.map((b) => b.car))];
      const counted = builds.filter((b) => !b.excluded);
      const left = builds.length - counted.length;
      host.replaceChildren(
        h(
          'table',
          { class: 'manual__table manual__table--builds' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              ...['Build', 'Dyno and correction', 'Sheet', 'Model', 'Off by'].map((t) =>
                h('th', { text: t, attrs: { scope: 'col' } }),
              ),
            ),
          ),
          ...cars.map((car) =>
            h(
              'tbody',
              {},
              h(
                'tr',
                { class: 'manual__car' },
                h('th', { text: car, attrs: { colspan: '5', scope: 'rowgroup' } }),
              ),
              ...builds
                .filter((b) => b.car === car)
                .map((b) =>
                  h(
                    'tr',
                    {
                      class: b.excluded ? 'manual__excluded' : b.pass ? '' : 'manual__miss',
                    },
                    h(
                      'th',
                      { attrs: { scope: 'row' } },
                      h('a', {
                        text: b.title,
                        attrs: { href: b.source.url, target: '_blank', rel: 'noopener noreferrer' },
                      }),
                      h('span', {
                        class: 'manual__who',
                        text: `${b.who}${b.date ? `, ${b.date}` : ''}`,
                      }),
                      ...(b.excluded
                        ? [h('span', { class: 'manual__why', text: `Not counted: ${b.excluded}` })]
                        : []),
                    ),
                    h('td', {
                      text: `${b.dyno}, ${b.correction}${b.correctionAssumed ? ' (assumed: not printed)' : ''}`,
                    }),
                    h('td', { class: 'manual__value', text: powerText(b.measured, units.power) }),
                    h('td', { class: 'manual__value', text: powerText(b.predicted, units.power) }),
                    h('td', { class: 'manual__value', text: signed(b.error) }),
                  ),
                ),
            ),
          ),
        ),
        h('p', {
          text: `${String(counted.filter((b) => b.pass).length)} of ${String(counted.length)} builds land within ${percentText(tolerance, 0)} of the sheet${left > 0 ? `; ${String(left)} more ${left === 1 ? 'is' : 'are'} shown but not counted` : ''}. Wheel power, as each build’s own dyno printed it.`,
        }),
      );
    },
    (error: unknown) => {
      host.replaceChildren(
        h('p', {
          text: `The known builds didn’t run: ${error instanceof Error ? error.message : String(error)}`,
        }),
      );
    },
  );
  return host;
}

export function buildManual(
  index: CatalogueIndex,
  units: DisplayUnits,
  knownBuilds: Promise<KnownBuildTable>,
): HTMLElement[] {
  const k = (id: SimAssumption['id']) => index.assumptions.find((a) => a.id === id)?.printed ?? '';
  const loss = (id: SimAssumption['id']) => {
    const value = index.assumptions.find((a) => a.id === id)?.value ?? 1;
    return `${num((1 - value) * 100)}${NBSP}%`;
  };
  return [
    section(
      'What the sheet shows',
      'Crank power and torque for the trim you pick, at the ambient temperature, altitude and fuel you pick. Solid line: power. Dashed line: torque.',
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
      'Altitude',
      'Air pressure falls with height. Jeddah is at sea level (101.3 kPa); Riyadh, about 600 m up, averages 94.2 kPa in the International Standard Atmosphere. A custom elevation uses the same formula (US Standard Atmosphere 1976).',
      'A naturally aspirated engine breathes that thinner air and loses about 7 % in Riyadh. A turbo engine’s boost control aims for the same absolute manifold pressure it would hold at sea level, so the turbo spins harder to make up the difference and the engine gets nearly the same air. That lasts until the turbo runs out of headroom (its compressor’s choke line or top speed); past there, boost and power fall, and the sheet says where.',
    ),
    section(
      'Boost',
      'A turbo engine gets a compressor map (how much air the compressor moves at each pressure ratio, and how efficiently) and a turbine that has to find the energy to drive it. Below the spool point the turbine can’t hold the target boost yet; above it the wastegate opens. If the compressor reaches surge, choke or its speed limit, the sheet names it.',
      'Sequential twins (2JZ-GTE, 13B-REW, 20B-REW) run on one turbo up to the changeover rpm, then on both. Factory compressor maps aren’t public, so each stock turbo is sized to its own engine’s rated output and, where it is published, its boost.',
      'Compressed air comes out hot; the intercooler takes most of that heat away, and what is left reaches the cylinders.',
    ),
    section(
      'Fuel, octane and knock',
      `Hotter charge air, more boost and lower octane push an engine towards knock, so its ECU takes ignition timing away, and that costs torque. The model compares your conditions with the rating’s at the factory’s peak boost: about one degree of timing for every octane number short, every 7 °C of extra charge-air temperature (${k('knock-octane-per-kelvin')}) and every 10 % more manifold pressure, which costs about 3.5 octane numbers (${k('knock-octane-per-kpa')} near one atmosphere, applied per fraction of pressure).`,
      `A factory ECU never adds timing beyond its map, so a fuel better than the one the car was rated on gains nothing on a stock car. On too low an octane it retards up to about ${k('knock-max-retard')} from best timing, then holds the boost down.`,
      'Saudi pumps sell 91 and 95 RON everywhere and 98 RON in Riyadh, Jeddah, the Dammam area and on the highways between. Race fuel (VP MS109, 109 RON) and E85-type fuel (VP C85) come in 5-gallon pails from VP Racing’s distributor in Jeddah; no Saudi pump sells E85. Both need a tune, so the model assumes one, with timing at the knock limit on that fuel. E85 needs about half as much fuel again by volume: on factory injectors the sheet shows them running out.',
    ),
    section(
      'Stock calibration: why some numbers are hidden',
      'Before a trim shows any numbers, the model has to reproduce its factory figures: peak power and peak torque within 3 %, each at the right rpm within 250 rpm, and every point of Nissan Europe’s published 350Z torque curves within 3 %.',
      'Each factory figure is checked under its own rating standard, on the fuel its market rated on. Where the maker doesn’t print the standard, the usual one for that market and year is assumed, and the band is widened.',
      standardsTable(index, units),
      'The calibration fits each engine’s breathing, and for a turbo engine its turbo, to those figures, inside physical limits. A pass shows the model reproduces the stock engine; the known builds below check that it predicts modified ones.',
    ),
    section(
      'Known builds',
      'Documented real cars with a published dyno sheet or build thread, at least three per car, run through the model with their parts, boost, fuel and dyno-day air. Dynos read the same car differently (a Mainline roller reads about 16 % below a Dynojet, a Mustang about 12 %), and sheets are corrected to different standards (SAE J1349, STD, DIN), so each prediction is turned into what that dyno would have printed before it is compared. Every build has to land within 10 % of the sheet’s peak wheel power, and the site’s build fails if one doesn’t.',
      'Builds whose power comes from parts the model can’t represent (camshafts, porting, bigger displacement, another engine’s ECU program) are left out; the research notes list them and why. A build whose own sheet contradicts itself stays in the table, marked, but doesn’t count.',
      knownBuildsTable(knownBuilds, units),
    ),
    section(
      'Heat soak',
      'Heat goes into the coolant and the oil as a share of the fuel burnt: about a fifth into the coolant for a piston engine, less but with far more into the oil for a rotary. The radiator gives it to the air in proportion to how much hotter the coolant is than the air, and less at low air speed; the oil gives its heat to the coolant, or on the RX-7 to its own oil-to-air cooler.',
      'No maker publishes its radiator’s capacity, so the factory system is sized by one rule for every car: it holds 105 °C at full rated power at top-speed airflow on a 40 °C day. The heat-soak test then asks for a 3-minute drift session at 70-90 % of full load with 3 m/s of air through the radiator, at your ambient, and fails if the coolant passes 115 °C or the oil 150 °C. Stock systems aren’t sized for that; cooling parts are where it gets fixed.',
    ),
    section(
      'Limits',
      `Some limits cap the curve where they bind: injectors past ${k('injector-duty-limit')} duty (the tune holds the fuel there), and a compressor at surge, choke or its speed limit. Part ratings (rods and pistons, clutch, gearbox, diff and axles) are flagged when a build exceeds them but don’t bend the curve. Most stock parts have no rating on file yet; the parts catalogue adds them.`,
    ),
    section(
      'Not in the model yet',
      'Intercooler heat soak (the charge air getting hotter over a session), cooling parts, and the parts catalogue that lets you change the build yourself come in Phase 3.',
    ),
    section(
      'Every assumption',
      'Each number the model uses that isn’t a car’s own data, with how sure we are and where it comes from.',
      assumptionsTable(index.assumptions),
    ),
  ];
}
