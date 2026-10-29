import type { Currency } from '@/entities/portfolio';

import type { BondTerm } from '../bondTerm';

export type BondSort = 'maturity' | 'rate';

export type BondPickerFiltersState = {
  /** Null, or a currency no bond in circulation has: the first currency that has some */
  currency: Currency | null;
  term: BondTerm;
  sort: BondSort;
};
