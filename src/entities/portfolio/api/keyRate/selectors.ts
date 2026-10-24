import { useKeyRateStore } from './store';
import type { KeyRate } from './types';

export function useCachedKeyRate(date: string): number | null {
  return useKeyRateStore((state) => state.byDate[date]?.rate ?? null);
}

export function getCachedKeyRate(date: string): KeyRate | undefined {
  return useKeyRateStore.getState().byDate[date];
}
