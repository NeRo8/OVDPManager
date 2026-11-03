import { useBondPickerFiltersStore } from './store';
import type { BondPickerFiltersState } from './types';

export function useBondPickerFilters(): BondPickerFiltersState {
  return useBondPickerFiltersStore();
}
