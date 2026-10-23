import {
  type Currency,
  type ScheduleEvent,
  type Wallet,
  compareScheduleEvents,
} from '@/entities/portfolio';
import { addMonthsISO } from '@/shared/lib';
import type { PaymentFilters } from './paymentFilters';

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

/**
 * A tab of the payments schedule. `upcoming`: payments not yet received, up to the end of the
 * period filter; no purchases. `years`: every payment and purchase; the year tab picks the year
 * itself, so the period filter does not apply.
 */
export type ScheduleView = 'upcoming' | 'years';

export type FilteredSchedule = {
  /** Events that pass the filters, in schedule order */
  events: ScheduleEvent[];
  /** How many events the view has without the filters */
  totalCount: number;
};

/**
 * The events a schedule tab lists. The payment type narrows payments only: purchases stay
 * whatever type is chosen.
 */
export function filterSchedule(
  wallet: Pick<Wallet, 'payments' | 'purchaseEvents' | 'today'>,
  filters: PaymentFilters,
  view: ScheduleView,
): FilteredSchedule {
  const all: ScheduleEvent[] =
    view === 'upcoming'
      ? wallet.payments.filter((payment) => !payment.isPaid)
      : [...wallet.payments, ...wallet.purchaseEvents];
  const lastDate =
    view === 'upcoming' && filters.period !== 'all'
      ? addMonthsISO(wallet.today, filters.period)
      : null;
  const events = all
    .filter(
      (event) =>
        (filters.currency === 'all' || event.currency === filters.currency) &&
        (filters.isins.length === 0 || filters.isins.includes(event.isin)) &&
        (event.type === 'purchase' || filters.kind === 'all' || event.type === filters.kind) &&
        (lastDate === null || event.date <= lastDate),
    )
    .sort(compareScheduleEvents);
  return { events, totalCount: all.length };
}
