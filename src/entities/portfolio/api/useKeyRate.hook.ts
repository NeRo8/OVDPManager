import { useQuery } from '@tanstack/react-query';

import { todayISO } from '@/shared/lib';
import { getCachedKeyRate, saveKeyRate, useCachedKeyRate } from './keyRate';
import { fetchKeyRate } from './nbuKeyRate';

/** Today's rate changes at NBU board meetings, a few times a year; a past date's never does. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * The NBU key policy rate in effect on `date`, % a year, or null until it has loaded once. A date
 * ahead gets today's rate, the best guess there is. A failed request stays silent: only a
 * comparison in the purchase hints depends on it, and without the rate it is left out.
 */
export function useKeyRate(date: string): number | null {
  const today = todayISO();
  const rateDate = date < today ? date : today;
  const rate = useCachedKeyRate(rateDate);
  useQuery({
    queryKey: ['nbu', 'key-rate', rateDate],
    queryFn: async ({ signal }) => {
      const fetched = await fetchKeyRate(rateDate, signal);
      saveKeyRate(rateDate, fetched, Date.now());
      return fetched;
    },
    staleTime: rateDate < today ? Infinity : STALE_AFTER_MS,
    initialData: () => getCachedKeyRate(rateDate)?.rate,
    initialDataUpdatedAt: () => getCachedKeyRate(rateDate)?.updatedAt,
  });

  return rate;
}
