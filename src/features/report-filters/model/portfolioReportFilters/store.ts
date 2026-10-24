import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { PortfolioReportFiltersState } from './types';

const STORAGE_KEY = 'portfolio-report-filters-v1';

export const initialState: PortfolioReportFiltersState = {
  status: 'all',
  currency: null,
  isins: [],
};

/** Filters of the portfolio report; every change applies at once and is remembered. */
export const usePortfolioReportFiltersStore = create<PortfolioReportFiltersState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
