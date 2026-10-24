import { useYieldReportFiltersStore } from './store';
import type { YieldReportFilters } from './types';

export function useYieldReportFilters(): YieldReportFilters {
  return useYieldReportFiltersStore();
}
