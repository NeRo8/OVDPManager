import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  type LegacyPurchase,
  migratePurchases,
  withPlannedFlags,
} from '@/lib/portfolio/migrateOperations';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import { useBondsStore } from '@/stores/bonds/store';
import { todayISO } from '@/utils/date';
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
    // 0 kept `purchases`; 1 had operations without `planned`, which confirmation added in 2.
    version: 2,
    migrate: (persisted, version) => {
      const today = todayISO();
      if (version === 0) {
        const legacy = persisted as { purchases: LegacyPurchase[] };
        return {
          operations: migratePurchases(
            legacy.purchases,
            useBondsStore.getState().bonds ?? [],
            today,
          ),
        };
      }
      const saved = persisted as { operations: Omit<PlanOperation, 'planned'>[] };
      return { operations: withPlannedFlags(saved.operations, today) };
    },
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
