import type { Bond } from '../../model/portfolio';

import { useBondsStore } from './store';
import type { BondsState } from './types';

export function useCachedBonds(): Bond[] | null {
  return useBondsStore((state) => state.bonds);
}

export function useBondsUpdatedAt(): number | null {
  return useBondsStore((state) => state.updatedAt);
}

export function getCachedBonds(): BondsState {
  return useBondsStore.getState();
}
