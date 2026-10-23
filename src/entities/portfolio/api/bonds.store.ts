import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Bond } from '../model/portfolio';
import { fetchBonds } from './nbuBonds';
import { mmkvStorage, showToast } from '@/shared/lib';

const CACHE_KEY = 'nbu-bonds-v1';
/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
/** After a failed automatic refresh, screens opening soon after do not try again on their own. */
const RETRY_AFTER_MS = 5 * 60 * 1000;

type CachedBonds = {
  bonds: Bond[] | null;
  updatedAt: number | null;
};

type BondsRequestState = {
  error: string | null;
  failedAt: number | null;
};

const useBondsCacheStore = create<CachedBonds>()(
  persist((): CachedBonds => ({ bonds: null, updatedAt: null }), {
    name: CACHE_KEY,
    version: 1,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);

const useBondsRequestStore = create<BondsRequestState>()(() => ({
  error: null,
  failedAt: null,
}));

/** The request in progress, so a refresh asked for meanwhile waits for it instead of returning. */
let inFlight: Promise<void> | null = null;

function refreshBonds(): Promise<void> {
  inFlight ??= loadBonds().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function loadBonds(): Promise<void> {
  useBondsRequestStore.setState({ error: null });
  try {
    const bonds = await fetchBonds();
    const updatedAt = Date.now();
    useBondsCacheStore.setState({ bonds, updatedAt });
    useBondsRequestStore.setState({ failedAt: null });
  } catch (error) {
    // NbuError from the client, or a malformed response from fetchBonds: both carry a ready message.
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити дані НБУ';
    useBondsRequestStore.setState({ error: message, failedAt: Date.now() });
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
  const error = useBondsRequestStore((state) => state.error);

  useEffect(() => {
    const now = Date.now();
    const lastUpdate = useBondsCacheStore.getState().updatedAt;
    const { failedAt } = useBondsRequestStore.getState();
    const isStale = !lastUpdate || now - lastUpdate > STALE_AFTER_MS;
    const failedRecently = failedAt !== null && now - failedAt < RETRY_AFTER_MS;
    if (isStale && !failedRecently) void refreshBonds();
    // Only checked on mount: refreshes after that are user-initiated.
  }, []);

  const byIsin = useMemo(() => new Map((bonds ?? []).map((bond) => [bond.isin, bond])), [bonds]);

  return { bonds, error, byIsin, refresh: refreshBonds };
}
