import { filterSchedule } from '@/features/payment-filters';
import type { FilteredWallet } from './useFilteredWallet.hook';
import { groupScheduleEventsByMonth } from './scheduleSections';

/** Payments still ahead that pass the filters, and how many there are without them. */
export function upcomingPayments({ wallet, filters }: FilteredWallet) {
  const { events, totalCount } = filterSchedule(wallet, filters, 'upcoming');
  return { upcoming: events, allCount: totalCount, sections: groupScheduleEventsByMonth(events) };
}
