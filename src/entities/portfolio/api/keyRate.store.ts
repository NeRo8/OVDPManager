import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

const CACHE_KEY = 'nbu-key-rate-v1';

type CachedKeyRate = {
  /** % a year */
  rate: number | null;
  /** When NBU sent it, ms */
  updatedAt: number | null;
};

/** The last NBU key policy rate. */
const useKeyRateStore = create<CachedKeyRate>()(
  persist((): CachedKeyRate => ({ rate: null, updatedAt: null }), {
    name: CACHE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);

export function useCachedKeyRate(): number | null {
  return useKeyRateStore((state) => state.rate);
}

export function getCachedKeyRate(): CachedKeyRate {
  return useKeyRateStore.getState();
}

export function saveKeyRate(rate: number, updatedAt: number): void {
  useKeyRateStore.setState({ rate, updatedAt });
}
