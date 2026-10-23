import { initialState, usePaymentFiltersStore } from './store';
import type { PaymentFilters } from './types';

export function updatePaymentFilters(patch: Partial<PaymentFilters>): void {
  usePaymentFiltersStore.setState(patch);
}

/** Adds the bond to the shown ones, or removes it. */
export function togglePaymentFilterIsin(isin: string): void {
  usePaymentFiltersStore.setState(({ isins }) => ({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  }));
}

export function resetPaymentFilters(): void {
  usePaymentFiltersStore.setState(initialState);
}
