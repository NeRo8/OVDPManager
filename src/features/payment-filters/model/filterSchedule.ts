import { type ScheduleEvent, type Wallet, compareScheduleEvents } from '@/entities/portfolio';
import type { PaymentFilters } from './paymentFilters';

/**
 * The saved filters with bonds that are no longer in the wallet dropped: a bond sold since must
 * not hide every payment.
 */
export function effectiveFilters(filters: PaymentFilters, isins: string[]): PaymentFilters {
  return { ...filters, isins: filters.isins.filter((isin) => isins.includes(isin)) };
}

export function countActiveFilters(filters: PaymentFilters): number {
  return [filters.types.length > 0, filters.time !== 'all', filters.isins.length > 0].filter(
    Boolean,
  ).length;
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
        (filters.types.length === 0 || filters.types.includes(event.type)) &&
        (filters.isins.length === 0 || filters.isins.includes(event.isin)) &&
        (filters.time === 'all' || isPastEvent(event, wallet.today) === (filters.time === 'past')),
    )
    .sort(compareScheduleEvents);
  return { events, totalCount: all.length };
}
