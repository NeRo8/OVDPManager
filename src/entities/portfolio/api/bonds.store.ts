import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Bond } from '../model/portfolio';
import { mmkvStorage } from '@/shared/lib';

const CACHE_KEY = 'nbu-bonds-v1';

type CachedBonds = {
  bonds: Bond[] | null;
  /** When NBU sent them, ms */
  updatedAt: number | null;
};

/** The last NBU catalog, kept so the app works offline and opens without waiting for NBU. */
const useBondsCacheStore = create<CachedBonds>()(
  persist((): CachedBonds => ({ bonds: null, updatedAt: null }), {
    name: CACHE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);

export function useCachedBonds(): Bond[] | null {
  return useBondsCacheStore((state) => state.bonds);
}

export function getCachedBonds(): CachedBonds {
  return useBondsCacheStore.getState();
}

export function saveBonds(bonds: Bond[], updatedAt: number): void {
  useBondsCacheStore.setState({ bonds, updatedAt });
}
