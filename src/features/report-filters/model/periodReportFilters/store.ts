import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { PeriodReportFiltersState } from './types';

const STORAGE_KEY = 'period-report-filters-v1';

export const initialState: PeriodReportFiltersState = {
  period: 'last12Months',
  custom: null,
  currency: null,
  isins: [],
};

/** Period and filters of the period report; every change applies at once and is remembered. */
export const usePeriodReportFiltersStore = create<PeriodReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
