import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { YearReportFiltersState } from './types';

const STORAGE_KEY = 'year-report-filters-v1';

export const initialState: YearReportFiltersState = {
  year: null,
  currency: null,
  isins: [],
};

/** Year and filters of the year report; every change applies at once and is remembered. */
export const useYearReportFiltersStore = create<YearReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
