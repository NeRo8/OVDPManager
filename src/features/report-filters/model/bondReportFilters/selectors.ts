import { useBondReportFiltersStore } from './store';
import type { BondReportFilters } from './types';

export function useBondReportFilters(): BondReportFilters {
  return useBondReportFiltersStore();
}
