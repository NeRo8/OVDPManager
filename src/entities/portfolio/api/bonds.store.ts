import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Bond } from '../model/portfolio';
import { fetchBonds } from './nbuBonds';
import { mmkvStorage, showToast } from '@/shared/lib';

const CACHE_KEY = 'nbu-bonds-v1';
/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

type CachedBonds = {
  bonds: Bond[] | null;
  updatedAt: number | null;
};

type BondsRequestState = {
  isFetching: boolean;
  error: string | null;
};

const useBondsCacheStore = create<CachedBonds>()(
  persist((): CachedBonds => ({ bonds: null, updatedAt: null }), {
    name: CACHE_KEY,
    version: 1,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);

const useBondsRequestStore = create<BondsRequestState>()(() => ({
  isFetching: false,
  error: null,
}));

async function refreshBonds(): Promise<void> {
  if (useBondsRequestStore.getState().isFetching) return;
  useBondsRequestStore.setState({ isFetching: true, error: null });
  try {
    const bonds = await fetchBonds();
    const updatedAt = Date.now();
    useBondsCacheStore.setState({ bonds, updatedAt });
    useBondsRequestStore.setState({ isFetching: false });
  } catch (error) {
    // NbuError from the client, or a malformed response from fetchBonds: both carry a ready message.
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити дані НБУ';
    useBondsRequestStore.setState({ isFetching: false, error: message });
    // Without cached bonds the screens show the error full-screen with a retry, so no toast then.
    if (useBondsCacheStore.getState().bonds) {
      showToast({
        tone: 'error',
        title: 'Не вдалося оновити дані НБУ',
        message: `${message}. Показано збережені дані.`,
        action: { label: 'Повторити', onPress: () => void refreshBonds() },
      });
    }
  }
}

export function useBonds() {
  const bonds = useBondsCacheStore((state) => state.bonds);
  const isFetching = useBondsRequestStore((state) => state.isFetching);
  const error = useBondsRequestStore((state) => state.error);

  useEffect(() => {
    const lastUpdate = useBondsCacheStore.getState().updatedAt;
    if (!lastUpdate || Date.now() - lastUpdate > STALE_AFTER_MS) {
      void refreshBonds();
    }
    // Only checked on mount: refreshes after that are user-initiated.
  }, []);

  const byIsin = useMemo(() => new Map((bonds ?? []).map((bond) => [bond.isin, bond])), [bonds]);

  return { bonds, isFetching, error, byIsin, refresh: refreshBonds };
}
