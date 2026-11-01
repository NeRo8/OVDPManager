import {
  type Bond,
  CURRENCIES,
  type Currency,
  bondChoices,
  maturityTerm,
} from '@/entities/portfolio';

import type { BondPickerFiltersState, BondTerm } from './bondPickerFilters';

type FilterOption<T> = { value: T; count: number };

const TERMS = ['all', 'short', 'medium', 'long'] as const satisfies readonly BondTerm[];

export type BondPicker = {
  isSearching: boolean;
  /** Currencies with bonds in circulation, and the one chosen even without any; with counts */
  currencies: FilterOption<Currency>[];
  /** The chosen currency, else the first with bonds in circulation, else UAH */
  currency: Currency;
  /** Every term with its count in the currency shown */
  terms: FilterOption<BondTerm>[];
  /** The rows: the search's results, or the filtered and sorted bonds */
  choices: Bond[];
  /** How many bonds the filters leave, the search aside */
  filteredCount: number;
  /** What differs from a fresh picker; the order counts too, as it changes what comes first */
  activeFilterCount: number;
};

/**
 * The bond picker: bonds in circulation narrowed by currency and term and sorted by maturity or
 * rate. A search looks through every bond, by ISIN, maturity date or rate, and sets the filters
 * aside.
 */
export function bondPicker(
  bonds: Bond[],
  filters: BondPickerFiltersState,
  query: string,
  today: string,
): BondPicker {
  const isSearching = query.trim().length > 0;
  const inCirculation = bondChoices(bonds, '', today);
  const currencies = CURRENCIES.map((value) => ({
    value,
    count: inCirculation.filter((bond) => bond.currency === value).length,
  })).filter((option) => option.count > 0 || option.value === filters.currency);
  const defaultCurrency = currencies.find((option) => option.count > 0)?.value ?? 'UAH';
  const currency = filters.currency ?? defaultCurrency;
  const ofCurrency = inCirculation.filter((bond) => bond.currency === currency);
  const ofTerm = (term: BondTerm) =>
    term === 'all' ? ofCurrency : ofCurrency.filter((bond) => maturityTerm(bond, today) === term);
  const filtered = ofTerm(filters.term);
  const sorted =
    filters.sort === 'rate'
      ? [...filtered].sort(
          (a, b) => b.rate - a.rate || a.maturityDate.localeCompare(b.maturityDate),
        )
      : filtered;

  return {
    isSearching,
    currencies,
    currency,
    terms: TERMS.map((value) => ({ value, count: ofTerm(value).length })),
    choices: isSearching ? bondChoices(bonds, query, today) : sorted,
    filteredCount: sorted.length,
    activeFilterCount: [
      currency !== defaultCurrency,
      filters.term !== 'all',
      filters.sort !== 'maturity',
    ].filter(Boolean).length,
  };
}
