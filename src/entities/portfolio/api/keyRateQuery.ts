import { queryOptions } from '@tanstack/react-query';

import { todayISO } from '@/shared/lib';
import { getCachedKeyRateYear, saveKeyRateYear } from './keyRate';
import { fetchKeyRates } from './nbuKeyRate';

/** The rate changes at NBU board meetings, a few times a year; a past year's never does. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/** The date whose rate stands for `date`: itself, or today for a date ahead. */
export function keyRateDate(date: string): string {
  const today = todayISO();
  return date < today ? date : today;
}

/** The year whose rates hold a date's rate. */
export function keyRateYear(date: string): number {
  return Number(keyRateDate(date).slice(0, 4));
}

/**
 * Fetches a year's rates and saves them in the store the screens read. A past year is asked once;
 * the current one again when its rates are older than half a day or a new day has begun.
 */
export function keyRateQuery(year: number) {
  const today = todayISO();
  const isPast = year < Number(today.slice(0, 4));
  const throughDate = isPast ? `${year}-12-31` : today;
  const cached = getCachedKeyRateYear(year);
  const complete = cached && cached.throughDate >= throughDate;

  return queryOptions({
    queryKey: ['nbu', 'key-rate', year],
    queryFn: async ({ signal }) => {
      const rates = await fetchKeyRates(year, throughDate, signal);
      saveKeyRateYear(year, { rates, throughDate, updatedAt: Date.now() });
      return rates;
    },
    staleTime: isPast ? Infinity : STALE_AFTER_MS,
    initialData: () => (complete ? cached.rates : undefined),
    initialDataUpdatedAt: () => (complete ? cached.updatedAt : undefined),
  });
}
