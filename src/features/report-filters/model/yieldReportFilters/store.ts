import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { YieldReportFiltersState } from './types';

const STORAGE_KEY = 'yield-report-filters-v1';

/** The portfolio's yield is first of all that of the bonds it still holds. */
export const initialState: YieldReportFiltersState = {
  status: 'inCirculation',
  currency: null,
  isins: [],
};

/** Filters of the yield report; every change applies at once and is remembered. */
export const useYieldReportFiltersStore = create<YieldReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
