import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

import type { PurchasesState } from './types';

const STORAGE_KEY = 'holdings-v1';

export const initialState: PurchasesState = { purchases: [] };

/** Purchases of every plan, each with its `planId`. */
export const usePurchasesStore = create<PurchasesState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
