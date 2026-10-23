import { useKeyRateStore } from './store';
import type { KeyRateState } from './types';

export function useCachedKeyRate(): number | null {
  return useKeyRateStore((state) => state.rate);
}

export function getCachedKeyRate(): KeyRateState {
  return useKeyRateStore.getState();
}
