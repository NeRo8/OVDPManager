import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/utils/storage';

import type { ExchangeRateState } from './types';

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(() => ({ byCurrencyYear: {} }), {
    name: 'nbu-exchange-rates-v1',
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
