import { useState } from 'react';

import { CURRENCIES, type Currency, bondChoices, useWallet } from '@/entities/portfolio';
import { useOptionChoice } from '@/shared/lib';
import { type BondTerm, termOf } from './bondTerm';

export type { BondTerm };
export type BondSort = 'maturity' | 'rate';

type FilterOption<T> = { value: T; count: number };

/**
 * The first step of adding a purchase. Bonds in circulation are narrowed by currency and term and
 * sorted by maturity or rate; a search by ISIN looks through every bond and sets the filters aside.
 */
export function useBondPicker() {
  const { bonds, error, refresh, today, positions } = useWallet();
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState<BondTerm>('all');
  const [sort, setSort] = useState<BondSort>('maturity');

  const isSearching = query.trim().length > 0;
  const inCirculation = bonds ? bondChoices(bonds, '', today) : [];
  const currencies: FilterOption<Currency>[] = CURRENCIES.map((value) => ({
    value,
    count: inCirculation.filter((bond) => bond.currency === value).length,
  })).filter((option) => option.count > 0);
  const [chosenCurrency, setCurrency] = useOptionChoice(currencies.map((option) => option.value));
  const currency = chosenCurrency ?? 'UAH';
  const ofCurrency = inCirculation.filter((bond) => bond.currency === currency);
  const terms: FilterOption<BondTerm>[] = (['all', 'short', 'medium', 'long'] as const).map(
    (value) => ({
      value,
      count:
        value === 'all'
          ? ofCurrency.length
          : ofCurrency.filter((bond) => termOf(bond, today) === value).length,
    }),
  );

  const filtered = ofCurrency.filter((bond) => term === 'all' || termOf(bond, today) === term);
  const sorted =
    sort === 'rate'
      ? [...filtered].sort(
          (a, b) => b.rate - a.rate || a.maturityDate.localeCompare(b.maturityDate),
        )
      : filtered;
  const choices = isSearching && bonds ? bondChoices(bonds, query, today) : sorted;
  const ownedQuantity = new Map(
    positions.map(({ position }) => [position.isin, position.quantity]),
  );

  return {
    bonds,
    error,
    refresh,
    today,
    query,
    setQuery,
    isSearching,
    currencies,
    currency,
    setCurrency,
    terms,
    term,
    setTerm,
    sort,
    setSort,
    choices,
    ownedQuantity,
  };
}
