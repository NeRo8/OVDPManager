import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { todayISO } from '@/shared/lib';
import { getCachedKeyRate, saveKeyRate, useCachedKeyRate } from './keyRate';
import { fetchKeyRate } from './nbuKeyRate';

/** The rate changes at NBU board meetings, a few times a year. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * The NBU key policy rate, % a year, or null until it has loaded once. A failed request stays
 * silent: only a comparison in the purchase hints depends on it, and without the rate it is left
 * out.
 */
export function useKeyRate(): number | null {
  const rate = useCachedKeyRate();
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['nbu', 'key-rate'],
    queryFn: ({ signal }) => fetchKeyRate(todayISO(), signal),
    staleTime: STALE_AFTER_MS,
    initialData: () => getCachedKeyRate().rate ?? undefined,
    initialDataUpdatedAt: () => getCachedKeyRate().updatedAt ?? undefined,
  });

  useEffect(() => {
    // The initial data came from the store, so only a newer answer is saved.
    if (data !== undefined && dataUpdatedAt > (getCachedKeyRate().updatedAt ?? 0)) {
      saveKeyRate(data, dataUpdatedAt);
    }
  }, [data, dataUpdatedAt]);

  return rate;
}
