import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistStorage, sqliteStorage, toISODate } from '@/shared/lib';
import { nbuClient } from './client';

const CACHE_KEY = 'nbu-usd-rate-v1';

export type UsdRate = {
  /** Hryvnias per dollar */
  rate: number;
  /** Date the NBU set the rate for, YYYY-MM-DD */
  date: string;
  /** Local date of the fetch — the rate is refreshed once a day */
  fetchedOn: string;
};

type CachedUsdRate = {
  usdRate: UsdRate | null;
};

type UsdRateRequestState = {
  isFetching: boolean;
};

function isUsdRate(value: unknown): value is UsdRate {
  if (typeof value !== 'object' || value === null) return false;
  const rate = value as Partial<UsdRate>;
  return (
    typeof rate.rate === 'number' &&
    Number.isFinite(rate.rate) &&
    typeof rate.date === 'string' &&
    typeof rate.fetchedOn === 'string'
  );
}

function decodeStoredRate(value: unknown): CachedUsdRate | null {
  if (typeof value !== 'object' || value === null || !('usdRate' in value)) return null;
  return value.usdRate === null || isUsdRate(value.usdRate) ? { usdRate: value.usdRate } : null;
}

function decodeLegacyRate(value: unknown): CachedUsdRate | null {
  return isUsdRate(value) ? { usdRate: value } : null;
}

const useUsdRateStore = create<CachedUsdRate>()(
  persist((): CachedUsdRate => ({ usdRate: null }), {
    name: CACHE_KEY,
    version: 1,
    storage: createPersistStorage(sqliteStorage, decodeStoredRate, decodeLegacyRate),
  }),
);

const useUsdRateRequestStore = create<UsdRateRequestState>()(() => ({ isFetching: false }));

async function refreshUsdRate(): Promise<void> {
  if (useUsdRateRequestStore.getState().isFetching) return;
  useUsdRateRequestStore.setState({ isFetching: true });
  try {
    const { data } = await nbuClient.get<{ rate: number; exchangedate: string }[]>(
      '/NBUStatService/v1/statdirectory/exchange?valcode=USD&json',
    );
    const [entry] = data;
    if (!entry?.rate) return;
    // exchangedate is DD.MM.YYYY
    const [d, m, y] = entry.exchangedate.split('.');
    useUsdRateStore.setState({
      usdRate: { rate: entry.rate, date: `${y}-${m}-${d}`, fetchedOn: toISODate(new Date()) },
    });
  } catch {
    // Offline: the cached rate stays; the plan also takes a rate typed by hand.
  } finally {
    useUsdRateRequestStore.setState({ isFetching: false });
  }
}

/** Official NBU dollar rate: the cached one until today's arrives, null when there is none. */
export function useUsdRate(): UsdRate | null {
  const current = useUsdRateStore((state) => state.usdRate);

  useEffect(() => {
    if (useUsdRateStore.getState().usdRate?.fetchedOn !== toISODate(new Date()))
      void refreshUsdRate();
    // Only checked on mount.
  }, []);

  return current;
}
