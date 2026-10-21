import { useState } from 'react';

import { CURRENCIES, type Bond, bondChoices, useWallet } from '@/entities/portfolio';

export type BondChoiceSection = {
  key: string;
  title: string;
  data: Bond[];
};

const CURRENCY_TITLES = { UAH: 'Гривневі', USD: 'Доларові', EUR: 'Євро' } as const;

/** The first step of adding a purchase: bonds to choose from, by currency, narrowed by ISIN. */
export function useBondPicker() {
  const { bonds, error, refresh, today, positions } = useWallet();
  const [query, setQuery] = useState('');

  const choices = bonds ? bondChoices(bonds, query, today) : [];
  const sections: BondChoiceSection[] = CURRENCIES.map((currency) => ({
    key: currency,
    title: CURRENCY_TITLES[currency],
    data: choices.filter((bond) => bond.currency === currency),
  })).filter((section) => section.data.length > 0);
  const ownedQuantity = new Map(
    positions.map(({ position }) => [position.isin, position.quantity]),
  );

  return { bonds, error, refresh, today, query, setQuery, sections, ownedQuantity };
}
