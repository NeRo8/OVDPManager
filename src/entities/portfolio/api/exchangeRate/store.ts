import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

import type { ExchangeRateState } from './types';

const STORAGE_KEY = 'nbu-exchange-rates-v1';

export const initialState: ExchangeRateState = { byCurrencyYear: {} };

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
