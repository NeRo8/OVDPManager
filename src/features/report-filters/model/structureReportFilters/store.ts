import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { StructureReportFiltersState } from './types';

const STORAGE_KEY = 'structure-report-filters-v1';

export const initialState: StructureReportFiltersState = {
  purchases: 'all',
  currency: null,
  isins: [],
};

/** Filters of the portfolio structure report; every change applies at once and is remembered. */
export const useStructureReportFiltersStore = create<StructureReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
