import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { RedemptionsReportFiltersState } from './types';

const STORAGE_KEY = 'redemptions-report-filters-v1';

export const initialState: RedemptionsReportFiltersState = {
  time: 'upcoming',
  currency: null,
  isins: [],
};

/** Filters of the redemptions report; every change applies at once and is remembered. */
export const useRedemptionsReportFiltersStore = create<RedemptionsReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
