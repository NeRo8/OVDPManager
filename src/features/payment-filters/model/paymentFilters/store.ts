import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { PaymentFiltersState } from './types';

const STORAGE_KEY = 'payment-filters-v1';

export const initialState: PaymentFiltersState = {
  kind: 'all',
  period: 'all',
  currency: 'all',
  isins: [],
};

/** Filters of the upcoming payments; every change applies at once and is remembered. */
export const usePaymentFiltersStore = create<PaymentFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
    // Complete the one-time reset of the former version-1 store and persist version 0.
    migrate: () => initialState,
  }),
);
