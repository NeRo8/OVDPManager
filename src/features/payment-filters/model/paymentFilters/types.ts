import type { Currency } from '@/entities/portfolio';

export type PaymentKindFilter = 'all' | 'coupon' | 'redemption';
/** Months ahead of today, or every future payment. Only the upcoming list uses it: the year view has its own year. */
export type PaymentPeriodFilter = 'all' | 3 | 6 | 12;

export type PaymentFiltersState = {
  kind: PaymentKindFilter;
  period: PaymentPeriodFilter;
  currency: Currency | 'all';
  /** Bonds to show; empty shows every bond */
  isins: string[];
};

/** The filters as screens and calculations use them. */
export type PaymentFilters = PaymentFiltersState;
