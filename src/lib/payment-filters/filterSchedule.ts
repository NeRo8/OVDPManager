import { type ScheduleEvent, compareScheduleEvents } from '@/lib/portfolio/portfolio';
import { type Wallet, type WalletScopeOptions, isinsIn } from '@/lib/portfolio/wallet';
import type { PaymentFilters } from '@/stores/paymentFilters';

/**
 * The saved filters fitted to the wallet. The schedule shows one currency: a currency the wallet
 * no longer has gives way to the first one it has. Of the bonds picked, only those of that currency
 * the wallet still holds are kept; the store keeps the others for when their currency is picked
 * again, so a saved filter never hides everything.
 */
export function effectiveFilters(
  filters: PaymentFilters,
  options: WalletScopeOptions,
): PaymentFilters {
  const currency =
    filters.currency && options.currencies.includes(filters.currency)
      ? filters.currency
      : (options.currencies[0] ?? null);
  const isins = isinsIn(options, currency);
  return { ...filters, currency, isins: filters.isins.filter((isin) => isins.includes(isin)) };
}

/** What differs from fresh filters; another currency than the first one counts too. */
export function countActiveFilters(filters: PaymentFilters, options: WalletScopeOptions): number {
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
  /** Events in the selected currency before the other filters. */
  totalCount: number;
};

/**
 * Every payment and purchase of the wallet that passes the filters: of their currency and bonds,
 * of the types and the time picked. Each event belongs to one bond, whose payments and purchases
 * do not depend on the other bonds, so filtering the events gives what the wallet of only those
 * bonds would hold.
 */
export function filterSchedule(wallet: Wallet, filters: PaymentFilters): FilteredSchedule {
  const { currency, isins, types, time } = filters;
  const inCurrency = [...wallet.payments, ...wallet.purchaseEvents].filter(
    (event) => currency === null || event.currency === currency,
  );
  const events = inCurrency
    .filter(
      (event) =>
        (isins.length === 0 || isins.includes(event.isin)) &&
        (types.length === 0 || types.includes(event.type)) &&
        (time === 'all' || isPastEvent(event, wallet.today) === (time === 'past')),
    )
    .sort(compareScheduleEvents);
  return { events, totalCount: inCurrency.length };
}
