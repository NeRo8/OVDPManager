import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { PaymentFiltersState } from './types';

const STORAGE_KEY = 'payment-filters-v1';

export const initialState: PaymentFiltersState = {
  types: [],
  time: 'all',
  isins: [],
};

/** Filters of the payments schedule; every change applies at once and is remembered. */
export const usePaymentFiltersStore = create<PaymentFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
