import type { Currency, MaturityTerm } from '@/entities/portfolio';

/** The picker's term filter: any term, or one of the terms to maturity. */
export type BondTerm = 'all' | MaturityTerm;

export type BondSort = 'maturity' | 'rate';

export type BondPickerFiltersState = {
  /** Null chooses the first currency that has bonds in circulation. */
  currency: Currency | null;
  term: BondTerm;
  sort: BondSort;
};
