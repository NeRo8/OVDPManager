import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { YearOverYearReportFiltersState } from './types';

const STORAGE_KEY = 'year-over-year-report-filters-v1';

export const initialState: YearOverYearReportFiltersState = {
  currency: null,
  isins: [],
};

/** Filters of the year-over-year report; every change applies at once and is remembered. */
export const useYearOverYearReportFiltersStore = create<YearOverYearReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
