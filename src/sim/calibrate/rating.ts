import type {
  RatingStandardId,
  SimCatalogue,
  SimRatingStandard,
  SimVariant,
} from '../../data/sim-data';
import { ratingAtmosphere, type Atmosphere } from '../atmosphere';
import { pumpGasoline, type Fuel } from '../fuel';

/**
 * The conditions a factory figure was rated under: its standard's reference
 * atmosphere and the market's rating fuel. Figures whose standard isn't
 * printed (`unknown`) take the standard the data assumes for their market
 * (src/data/standards/power-ratings.json, `unknownStandard`), flagged as assumed.
 */
export interface RatingConditions {
  standard: SimRatingStandard;
  /** The figure's own label; `unknown` means `standard` is assumed. */
  printedStandard: RatingStandardId;
  assumed: boolean;
  air: Atmosphere;
  fuel: Fuel;
}

/** Compares YYYY or YYYY-MM at the precision both share. */
function compareMonths(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  return a.slice(0, n).localeCompare(b.slice(0, n));
}

/** The rule that decides an unlabelled figure's standard: by market, and by sale date where it matters. */
export function unknownStandardRule(
  catalogue: SimCatalogue,
  variant: SimVariant,
): SimCatalogue['unknownStandard'][number] | undefined {
  const market = variant.markets[0] ?? 'other';
  const start = variant.period.from;
  return catalogue.unknownStandard.find(
    (r) =>
      r.markets.includes(market) &&
      (r.from === undefined || compareMonths(start, r.from) >= 0) &&
      (r.to === undefined || compareMonths(start, r.to) <= 0),
  );
}

export function ratingConditions(catalogue: SimCatalogue, variant: SimVariant): RatingConditions {
  const market = variant.markets[0] ?? 'other';
  const printedStandard = variant.rating.standard;
  let id: Exclude<RatingStandardId, 'unknown'>;
  if (printedStandard === 'unknown') {
    const rule = unknownStandardRule(catalogue, variant);
    if (!rule) throw new Error(`No standard assumed for unlabelled ${market} figures.`);
    id = rule.assume;
  } else {
    id = printedStandard;
  }
  const standard = catalogue.standards.find((s) => s.id === id);
  if (!standard) throw new Error(`No reference conditions for "${id}".`);
  const reference = catalogue.referenceFuels.find((f) => f.market === market);
  if (!reference) throw new Error(`No rating fuel for ${market}.`);
  return {
    standard,
    printedStandard,
    assumed: printedStandard === 'unknown',
    air: ratingAtmosphere(standard),
    fuel: pumpGasoline(reference.ron, catalogue.constants),
  };
}
