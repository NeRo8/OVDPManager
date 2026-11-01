import { useState } from 'react';

import {
  CURRENCIES,
  type Currency,
  bondChoices,
  maturityTerm,
  useWallet,
} from '@/entities/portfolio';

import { useBondPickerFilters } from './bondPickerFilters';
import { type BondTerm } from './bondTerm';

export type { BondTerm };

type FilterOption<T> = { value: T; count: number };

/**
 * The first step of adding a purchase. Bonds in circulation are narrowed by currency and term and
 * sorted by maturity or rate; a search by ISIN looks through every bond and sets the filters aside.
 * The filters live in a store, so the picker and its filters screen share them.
 */
export function useBondPicker() {
  const { bonds, today, positions } = useWallet();
  const filters = useBondPickerFilters();
  const { term, sort } = filters;
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length > 0;
  const inCirculation = bonds ? bondChoices(bonds, '', today) : [];
  const currencies: FilterOption<Currency>[] = CURRENCIES.map((value) => ({
    value,
    count: inCirculation.filter((bond) => bond.currency === value).length,
  })).filter((option) => option.count > 0 || option.value === filters.currency);
  // Keep an explicit choice visible even when no bond in that currency is in circulation.
  const defaultCurrency = currencies.find((option) => option.count > 0)?.value ?? 'UAH';
  const currency = filters.currency ?? defaultCurrency;
  const ofCurrency = inCirculation.filter((bond) => bond.currency === currency);
  const terms: FilterOption<BondTerm>[] = (['all', 'short', 'medium', 'long'] as const).map(
    (value) => ({
      value,
      count:
        value === 'all'
          ? ofCurrency.length
          : ofCurrency.filter((bond) => maturityTerm(bond, today) === value).length,
    }),
  );

  const filtered = ofCurrency.filter(
    (bond) => term === 'all' || maturityTerm(bond, today) === term,
  );
  const sorted =
    sort === 'rate'
      ? [...filtered].sort(
          (a, b) => b.rate - a.rate || a.maturityDate.localeCompare(b.maturityDate),
        )
      : filtered;
  const choices = isSearching && bonds ? bondChoices(bonds, query, today) : sorted;
  // What the wallet holds of each bond, and how much of it is still only planned.
  const owned = new Map(
    positions.map(({ position, planned }) => [
      position.isin,
      { quantity: position.quantity, planned: planned.quantity },
    ]),
  );
  // What differs from a fresh picker; the order counts too, as it changes what comes first.
  const activeFilterCount = [
    currency !== defaultCurrency,
    term !== 'all',
    sort !== 'maturity',
  ].filter(Boolean).length;

  return {
    today,
    query,
    setQuery,
    isSearching,
    currencies,
    currency,
    terms,
    term,
    sort,
    choices,
    filteredCount: sorted.length,
    activeFilterCount,
    owned,
  };
}
