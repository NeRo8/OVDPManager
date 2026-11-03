import type { Bond } from '@/lib/portfolio/portfolio';

import { useBondsStore } from './store';
import type { BondPickerFilters, BondsState } from './types';

export function useCachedBonds(): Bond[] | null {
  return useBondsStore((state) => state.bonds);
}

export function useBondsUpdatedAt(): number | null {
  return useBondsStore((state) => state.updatedAt);
}

export function getCachedBonds(): BondsState {
  return useBondsStore.getState();
}

export function useBondPickerFilters(): BondPickerFilters {
  return useBondsStore((state) => state.filters);
}
