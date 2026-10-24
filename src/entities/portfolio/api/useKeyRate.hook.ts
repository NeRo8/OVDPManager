import { useQuery } from '@tanstack/react-query';

import { useCachedKeyRate } from './keyRate';
import { keyRateDate, keyRateQuery } from './keyRateQuery';

/**
 * The NBU key policy rate in effect on `date`, % a year, or null until it has loaded once. A date
 * ahead gets today's rate, the best guess there is. A failed request stays silent: only
 * comparisons depend on it, and without the rate they are left out.
 */
export function useKeyRate(date: string): number | null {
  const rateDate = keyRateDate(date);
  const rate = useCachedKeyRate(rateDate);
  useQuery(keyRateQuery(rateDate));
  return rate;
}
