import { useQueries } from '@tanstack/react-query';

import { useCachedKeyRates } from './keyRate';
import { keyRateDate, keyRateQuery } from './keyRateQuery';

/**
 * The NBU key policy rate on each of the dates, as `useKeyRate` gives it for one: a function of a
 * date, null until that date's rate has loaded. Each date is asked once and kept.
 */
export function useKeyRates(dates: string[]): (date: string) => number | null {
  const byDate = useCachedKeyRates();
  const rateDates = [...new Set(dates.map(keyRateDate))];
  useQueries({ queries: rateDates.map(keyRateQuery) });
  return (date) => byDate[keyRateDate(date)]?.rate ?? null;
}
