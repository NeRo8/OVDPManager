import type { Bond } from '@/lib/portfolio/portfolio';
import { recoverOperationBonds, syncOperationBonds } from '@/stores/operations';

import { initialState, useBondsStore } from './store';
import type { BondPickerFilters } from './types';

export function saveBonds(bonds: Bond[], updatedAt: number): void {
  recoverOperationBonds(useBondsStore.getState().bonds ?? []);
  syncOperationBonds(bonds);
  useBondsStore.setState({ bonds, updatedAt });
}

export function updateBondPickerFilters(patch: Partial<BondPickerFilters>): void {
  useBondsStore.setState(({ filters }) => ({
    filters: { ...filters, ...patch },
  }));
}

export function resetBondPickerFilters(): void {
  useBondsStore.setState({ filters: initialState.filters });
}
