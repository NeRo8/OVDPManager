import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { BondReportFiltersState } from './types';

const STORAGE_KEY = 'bond-report-filters-v1';

export const initialState: BondReportFiltersState = {
  isin: null,
};

/** The bond the bond report is about; a change applies at once and is remembered. */
export const useBondReportFiltersStore = create<BondReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
