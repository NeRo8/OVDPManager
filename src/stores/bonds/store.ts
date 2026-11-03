import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/utils/storage';

import type { BondsState } from './types';

const STORAGE_KEY = 'nbu-bonds-v1';

export const initialState: BondsState = {
  bonds: null,
  updatedAt: null,
  filters: { currency: null, term: 'all', sort: 'maturity' },
};

/**
 * The last NBU catalog, kept so the app works offline and opens without waiting for NBU, and the
 * bond picker's filters over it.
 */
export const useBondsStore = create<BondsState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
