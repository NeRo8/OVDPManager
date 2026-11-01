import {
  type ScheduleEvent,
  type Wallet,
  type WalletScopeOptions,
  compareScheduleEvents,
  fitScope,
  narrowWallet,
  isinsIn,
} from '@/entities/portfolio';

import type { PaymentFilters } from './paymentFilters';

/**
 * The saved filters fitted to the wallet as any scope is (`fitScope`), except that the schedule
 * shows one currency: one the wallet no longer has gives way to the first one it has.
 */
export function effectiveFilters(
  filters: PaymentFilters,
  options: WalletScopeOptions,
): PaymentFilters {
  const fitted = fitScope(filters, options);
  const currency = fitted.currency ?? options.currencies[0] ?? null;
  const isins = isinsIn(options, currency);
  return { ...fitted, currency, isins: fitted.isins.filter((isin) => isins.includes(isin)) };
}

/** What differs from fresh filters; another currency than the first one counts too. */
export function countActiveFilters(filters: PaymentFilters, options: WalletScopeOptions): number {
  return [
    filters.types.length > 0 || filters.excludeAllTypes === true,
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
  /** Events in the selected currency before the other filters. */
  totalCount: number;
};

/**
 * Every payment and purchase of the wallet that passes the filters: the wallet narrowed to their
 * currency and bonds, then its events of the types and the time picked.
 */
export function filterSchedule(wallet: Wallet, filters: PaymentFilters): FilteredSchedule {
  const narrowed = narrowWallet(wallet, filters);
  const events = [...narrowed.payments, ...narrowed.purchaseEvents]
    .filter(
      (event) =>
        !filters.excludeAllTypes &&
        (filters.types.length === 0 || filters.types.includes(event.type)) &&
        (filters.time === 'all' || isPastEvent(event, wallet.today) === (filters.time === 'past')),
    )
    .sort(compareScheduleEvents);
  const inCurrency = narrowWallet(wallet, { currency: filters.currency, isins: [] });
  return { events, totalCount: inCurrency.payments.length + inCurrency.purchaseEvents.length };
}
