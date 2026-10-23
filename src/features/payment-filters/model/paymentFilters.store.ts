import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import { DEFAULT_PAYMENT_FILTERS, type PaymentFilters } from './paymentFilters';

const usePaymentFiltersStore = create<PaymentFilters>()(
  persist((): PaymentFilters => DEFAULT_PAYMENT_FILTERS, {
    name: 'payment-filters-v1',
    version: 1,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);

export function usePaymentFilters(): PaymentFilters {
  return usePaymentFiltersStore();
}

export function updatePaymentFilters(patch: Partial<PaymentFilters>) {
  usePaymentFiltersStore.setState(patch);
}

/** Adds the bond to the shown ones, or removes it. */
export function togglePaymentFilterIsin(isin: string) {
  usePaymentFiltersStore.setState(({ isins }) => ({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  }));
}

export function resetPaymentFilters() {
  usePaymentFiltersStore.setState(DEFAULT_PAYMENT_FILTERS);
}
