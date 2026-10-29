import { useQueries } from '@tanstack/react-query';

import { keyRateOn, useCachedKeyRateYears } from './keyRate';
import { keyRateDate, keyRateQuery, keyRateYear } from './keyRateQuery';

/**
 * The NBU key policy rate on each of the dates, as `useKeyRate` gives it for one: a function of a
 * date, null until that date's year has loaded. Each year is asked once for all its dates.
 */
export function useKeyRates(dates: string[]): (date: string) => number | null {
  const byYear = useCachedKeyRateYears();
  const years = [...new Set(dates.map(keyRateYear))];
  useQueries({ queries: years.map(keyRateQuery) });
  return (date) => keyRateOn(byYear, keyRateDate(date));
}
