import type { MaturityTerm } from '@/lib/portfolio/market';
import type { Bond, BondKind, Currency } from '@/lib/portfolio/portfolio';

/** The picker's term filter: any term, or one of the terms to maturity. */
export type BondTerm = 'all' | MaturityTerm;

export type BondSort = 'maturity' | 'rate';

/** The bond picker's filters and order; every change applies at once and is remembered. */
export type BondPickerFilters = {
  /** Absent in filters saved before bond kinds were introduced. */
  kind?: BondKind | 'unknown' | 'all';
  /** Null chooses the first currency that has bonds in circulation. */
  currency: Currency | null;
  term: BondTerm;
  sort: BondSort;
};

export type BondsState = {
  bonds: Bond[] | null;
  /** When NBU sent them, ms */
  updatedAt: number | null;
  filters: BondPickerFilters;
};
