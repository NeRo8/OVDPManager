import { useQuery } from '@tanstack/react-query';

import { fetchBonds } from '@/api/nbu/nbuBonds';
import { getCachedBonds, saveBonds, useBondsUpdatedAt, useCachedBonds } from '@/stores/bonds';

/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
/**
 * The NBU bond catalog. The query asks NBU when the saved catalog is stale and saves each new
 * answer to the store, which the screens read: so they open with the saved catalog at once.
 */
export function useBonds() {
  const bonds = useCachedBonds();
  const updatedAt = useBondsUpdatedAt();
  const { error, refetch } = useQuery({
    queryKey: ['nbu', 'bonds'],
    queryFn: async ({ signal }) => {
      const fetched = await fetchBonds(signal);
      saveBonds(fetched, Date.now());
      return fetched;
    },
    staleTime: STALE_AFTER_MS,
    // The saved catalog and its age decide whether NBU is asked on launch.
    initialData: () => getCachedBonds().bonds ?? undefined,
    initialDataUpdatedAt: () => getCachedBonds().updatedAt ?? undefined,
    meta: { errorTitle: 'Не вдалося оновити дані НБУ' },
  });

  const byIsin = new Map((bonds ?? []).map((bond) => [bond.isin, bond]));

  return {
    bonds,
    updatedAt,
    // The client supplies the message for network errors.
    error: error?.message ?? null,
    byIsin,
    refresh: async () => {
      await refetch();
    },
  };
}
