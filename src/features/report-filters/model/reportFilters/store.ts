import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

import type { ReportFiltersState } from './types';

const STORAGE_KEY = 'report-filters-v1';

const ALL_BONDS = { currency: null, isins: [] };

export const initialState: ReportFiltersState = {
  year: { ...ALL_BONDS, year: null },
  fx: { currency: 'UAH', isins: [], year: null, targetCurrency: 'USD' },
  period: { ...ALL_BONDS, period: 'last12Months', custom: null },
  yearOverYear: ALL_BONDS,
  redemptions: { ...ALL_BONDS, time: 'upcoming' },
  portfolio: { ...ALL_BONDS, status: 'all' },
  structure: { ...ALL_BONDS, purchases: 'all' },
  // The portfolio's yield is first of all that of the bonds it still holds.
  yield: { ...ALL_BONDS, status: 'inCirculation' },
  bond: { isin: null },
};

/** Every report's filters; every change applies at once and is remembered. */
export const useReportFiltersStore = create<ReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
