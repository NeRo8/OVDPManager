import { type Currency, type PositionPayment, type PurchaseEvent } from '@/entities/portfolio';
import { addMonthsISO } from '@/shared/lib';

export const PAYMENT_KINDS = ['all', 'coupon', 'redemption'] as const;
export const PAYMENT_PERIODS = ['all', 3, 6, 12] as const;

export type PaymentKindFilter = (typeof PAYMENT_KINDS)[number];
/** Months ahead of today, or every future payment. Only the upcoming list uses it: the year view has its own year. */
export type PaymentPeriodFilter = (typeof PAYMENT_PERIODS)[number];

export type PaymentFilters = {
  kind: PaymentKindFilter;
  period: PaymentPeriodFilter;
  currency: Currency | 'all';
  /** Bonds to show; empty shows every bond */
  isins: string[];
};

export const DEFAULT_PAYMENT_FILTERS: PaymentFilters = {
  kind: 'all',
  period: 'all',
  currency: 'all',
  isins: [],
};

/** What the wallet's payments can be narrowed to. */
export type PaymentFilterOptions = {
  isins: string[];
  currencies: Currency[];
};

/**
 * The saved filters with choices that no longer exist dropped: a bond sold since, or a currency
 * the wallet no longer holds, must not hide every payment.
 */
export function effectiveFilters(
  filters: PaymentFilters,
  options: PaymentFilterOptions,
): PaymentFilters {
  return {
    ...filters,
    currency:
      filters.currency !== 'all' && options.currencies.includes(filters.currency)
        ? filters.currency
        : 'all',
    isins: filters.isins.filter((isin) => options.isins.includes(isin)),
  };
}

export function countActiveFilters(filters: PaymentFilters): number {
  return [
    filters.kind !== 'all',
    filters.period !== 'all',
    filters.currency !== 'all',
    filters.isins.length > 0,
  ].filter(Boolean).length;
}

export function filterPayments(
  payments: PositionPayment[],
  filters: PaymentFilters,
  today: string,
): PositionPayment[] {
  const lastDate = filters.period === 'all' ? null : addMonthsISO(today, filters.period);
  return payments.filter(
    (payment) =>
      (filters.kind === 'all' || payment.type === filters.kind) &&
      (lastDate === null || payment.date <= lastDate) &&
      (filters.currency === 'all' || payment.currency === filters.currency) &&
      (filters.isins.length === 0 || filters.isins.includes(payment.isin)),
  );
}

/** Purchases of the chosen bonds and currency; payment type and period do not apply to them. */
export function filterPurchases(
  purchases: PurchaseEvent[],
  filters: PaymentFilters,
): PurchaseEvent[] {
  return purchases.filter(
    (purchase) =>
      (filters.currency === 'all' || purchase.currency === filters.currency) &&
      (filters.isins.length === 0 || filters.isins.includes(purchase.isin)),
  );
}
