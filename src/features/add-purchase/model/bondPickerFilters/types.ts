import type { Currency } from '@/entities/portfolio';

import type { BondTerm } from '../bondTerm';

export type BondSort = 'maturity' | 'rate';

export type BondPickerFiltersState = {
  /** Null chooses the first currency that has bonds in circulation. */
  currency: Currency | null;
  term: BondTerm;
  sort: BondSort;
};
