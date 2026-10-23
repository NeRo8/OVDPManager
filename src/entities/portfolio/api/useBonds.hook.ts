import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { fetchBonds } from './nbuBonds';
import { getCachedBonds, saveBonds, useCachedBonds } from './bonds';

/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
/** After a failed request, screens opening soon after do not try again on their own. */
const RETRY_AFTER_MS = 5 * 60 * 1000;

const notFailedRecently = (query: { state: { errorUpdatedAt: number } }) =>
  Date.now() - query.state.errorUpdatedAt > RETRY_AFTER_MS;

/**
 * The NBU bond catalog. The query asks NBU when the saved catalog is stale and saves each new
 * answer to the store, which the screens read: so they open with the saved catalog at once.
 */
export function useBonds() {
  const bonds = useCachedBonds();
  const { data, dataUpdatedAt, error, refetch } = useQuery({
    queryKey: ['nbu', 'bonds'],
    queryFn: ({ signal }) => fetchBonds(signal),
    staleTime: STALE_AFTER_MS,
    // The saved catalog and its age decide whether NBU is asked on launch.
    initialData: () => getCachedBonds().bonds ?? undefined,
    initialDataUpdatedAt: () => getCachedBonds().updatedAt ?? undefined,
    refetchOnMount: notFailedRecently,
    retryOnMount: notFailedRecently,
    meta: { errorTitle: 'Не вдалося оновити дані НБУ' },
  });

  useEffect(() => {
    // The initial data came from the store, so only a newer answer is saved.
    if (data && dataUpdatedAt > (getCachedBonds().updatedAt ?? 0)) saveBonds(data, dataUpdatedAt);
  }, [data, dataUpdatedAt]);

  const byIsin = useMemo(() => new Map((bonds ?? []).map((bond) => [bond.isin, bond])), [bonds]);

  return {
    bonds,
    // NbuError from the client, or a malformed response from fetchBonds: both carry a ready message.
    error: error?.message ?? null,
    byIsin,
    refresh: async () => {
      await refetch();
    },
  };
}
