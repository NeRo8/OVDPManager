import { queryOptions } from '@tanstack/react-query';

import { todayISO } from '@/shared/lib';
import { getCachedKeyRate, saveKeyRate } from './keyRate';
import { fetchKeyRate } from './nbuKeyRate';

/** Today's rate changes at NBU board meetings, a few times a year; a past date's never does. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/** The date whose rate stands for `date`: itself, or today for a date ahead. */
export function keyRateDate(date: string): string {
  const today = todayISO();
  return date < today ? date : today;
}

/** Fetches the rate on a date and saves it in the store the screens read. */
export function keyRateQuery(rateDate: string) {
  return queryOptions({
    queryKey: ['nbu', 'key-rate', rateDate],
    queryFn: async ({ signal }) => {
      const fetched = await fetchKeyRate(rateDate, signal);
      saveKeyRate(rateDate, fetched, Date.now());
      return fetched;
    },
    staleTime: rateDate < todayISO() ? Infinity : STALE_AFTER_MS,
    initialData: () => getCachedKeyRate(rateDate)?.rate,
    initialDataUpdatedAt: () => getCachedKeyRate(rateDate)?.updatedAt,
  });
}
