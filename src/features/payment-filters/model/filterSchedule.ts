import {
  type Currency,
  type ScheduleEvent,
  type Wallet,
  compareScheduleEvents,
} from '@/entities/portfolio';
import type { PaymentFilters } from './paymentFilters';

/** What the wallet's schedule can be narrowed to. */
export type PaymentFilterOptions = {
  isins: string[];
  /** In `CURRENCIES` order; the first one is the default */
  currencies: Currency[];
};

/**
 * The saved filters fitted to the wallet: a bond sold since is dropped, and a currency the wallet
 * no longer has gives way to the first one it has, so a saved filter never hides everything.
 */
export function effectiveFilters(
  filters: PaymentFilters,
  options: PaymentFilterOptions,
): PaymentFilters {
  return {
    ...filters,
    currency:
      filters.currency && options.currencies.includes(filters.currency)
        ? filters.currency
        : (options.currencies[0] ?? null),
    isins: filters.isins.filter((isin) => options.isins.includes(isin)),
  };
}

/** What differs from fresh filters; another currency than the first one counts too. */
export function countActiveFilters(filters: PaymentFilters, options: PaymentFilterOptions): number {
  return [
    filters.types.length > 0,
    filters.time !== 'all',
    filters.currency !== (options.currencies[0] ?? null),
    filters.isins.length > 0,
  ].filter(Boolean).length;
}

/** A payment counts as past once received, a purchase once its date has come. */
function isPastEvent(event: ScheduleEvent, today: string): boolean {
  return event.type === 'purchase' ? event.date <= today : event.isPaid;
}

export type FilteredSchedule = {
  /** Events that pass the filters, in schedule order */
  events: ScheduleEvent[];
  /** How many events the schedule has without the filters */
  totalCount: number;
};

/** Every payment and purchase of the wallet that passes the filters. */
export function filterSchedule(
  wallet: Pick<Wallet, 'payments' | 'purchaseEvents' | 'today'>,
  filters: PaymentFilters,
): FilteredSchedule {
  const all: ScheduleEvent[] = [...wallet.payments, ...wallet.purchaseEvents];
  const events = all
    .filter(
      (event) =>
        (filters.currency === null || event.currency === filters.currency) &&
        (filters.types.length === 0 || filters.types.includes(event.type)) &&
        (filters.isins.length === 0 || filters.isins.includes(event.isin)) &&
        (filters.time === 'all' || isPastEvent(event, wallet.today) === (filters.time === 'past')),
    )
    .sort(compareScheduleEvents);
  return { events, totalCount: all.length };
}
