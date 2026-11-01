import { useQuery } from '@tanstack/react-query';

import { useCachedKeyRate, useCachedKeyRateYears } from './keyRate';
import { keyRateDate, keyRateQuery, keyRateYear } from './keyRateQuery';

/**
 * The NBU key policy rate in effect on `date`, % a year, or null until its year has loaded once. A
 * date ahead gets today's rate, the best guess there is. A failed request stays silent: only
 * comparisons depend on it, and without the rate they are left out.
 */
export function useKeyRate(date: string): number | null {
  const rate = useCachedKeyRate(keyRateDate(date));
  useQuery(keyRateQuery(keyRateYear(date)));
  return rate;
}

/** When the rate for this date was last fetched, if a cache exists. */
export function useKeyRateUpdatedAt(date: string): number | null {
  const years = useCachedKeyRateYears();
  return years[keyRateYear(date)]?.updatedAt ?? null;
}
