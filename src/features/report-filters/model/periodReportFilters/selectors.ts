import { usePeriodReportFiltersStore } from './store';
import type { PeriodReportFilters } from './types';

export function usePeriodReportFilters(): PeriodReportFilters {
  return usePeriodReportFiltersStore();
}
