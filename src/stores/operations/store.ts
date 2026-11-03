import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type LegacyPurchase, migratePurchases } from '@/lib/portfolio/migrateOperations';
import { useBondsStore } from '@/stores/bonds/store';
import { mmkvStorage } from '@/utils/storage';

import type { OperationsState } from './types';

const STORAGE_KEY = 'holdings-v1';

export const initialState: OperationsState = {
  operations: [],
  filters: { types: [], time: 'all', currency: null, isins: [] },
};

/** Purchases of every plan, each with its `planId`, and the payments schedule's filters. */
export const useOperationsStore = create<OperationsState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    version: 1,
    migrate: (persisted) => {
      const legacy = persisted as { purchases: LegacyPurchase[] };
      return {
        operations: migratePurchases(legacy.purchases, useBondsStore.getState().bonds ?? []),
      };
    },
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
