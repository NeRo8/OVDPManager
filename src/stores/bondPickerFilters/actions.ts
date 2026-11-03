import { initialState, useBondPickerFiltersStore } from './store';
import type { BondPickerFiltersState } from './types';

export function updateBondPickerFilters(patch: Partial<BondPickerFiltersState>): void {
  useBondPickerFiltersStore.setState(patch);
}

export function resetBondPickerFilters(): void {
  useBondPickerFiltersStore.setState(initialState);
}
