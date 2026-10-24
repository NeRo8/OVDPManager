import { useKeyRateStore } from './store';
import type { KeyRate, KeyRateState } from './types';

export function useCachedKeyRate(date: string): number | null {
  return useKeyRateStore((state) => state.byDate[date]?.rate ?? null);
}

/** Every rate asked for so far, by date. */
export function useCachedKeyRates(): KeyRateState['byDate'] {
  return useKeyRateStore((state) => state.byDate);
}

export function getCachedKeyRate(date: string): KeyRate | undefined {
  return useKeyRateStore.getState().byDate[date];
}
