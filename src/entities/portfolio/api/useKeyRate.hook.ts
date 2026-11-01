import { useQuery } from '@tanstack/react-query';

import { useToday } from '@/shared/config';

import { useCachedKeyRate, useCachedKeyRateYears } from './keyRate';
import { keyRateDate, keyRateQuery, keyRateYear } from './keyRateQuery';

/** The key rate on a date, and whether it is missing because NBU could not be asked for it. */
export type KeyRate = {
  /** % a year; null until its year has loaded once */
  rate: number | null;
  /** No rate, as the request for its year failed: comparisons say so rather than just go */
  failed: boolean;
};

/**
 * The NBU key policy rate in effect on `date`. A date ahead gets today's rate, the best guess
 * there is. Only comparisons depend on it: without it they are left out, and a hint says why when
 * the request failed.
 */
export function useKeyRate(date: string): KeyRate {
  const today = useToday();
  const rate = useCachedKeyRate(keyRateDate(date, today));
  const { isError } = useQuery(keyRateQuery(keyRateYear(date, today), today));
  return { rate, failed: rate === null && isError };
}

/** When the rate for this date was last fetched, if a cache exists. */
export function useKeyRateUpdatedAt(date: string): number | null {
  const today = useToday();
  const years = useCachedKeyRateYears();
  return years[keyRateYear(date, today)]?.updatedAt ?? null;
}
