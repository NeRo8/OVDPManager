import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

import type { BondPickerFiltersState } from './types';

const STORAGE_KEY = 'bond-picker-filters-v1';

export const initialState: BondPickerFiltersState = {
  currency: null,
  term: 'all',
  sort: 'maturity',
};

/** Filters and order of the bond picker; every change applies at once and is remembered. */
export const useBondPickerFiltersStore = create<BondPickerFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
