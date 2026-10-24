import { useYearReportFiltersStore } from './store';
import type { YearReportFilters } from './types';

export function useYearReportFilters(): YearReportFilters {
  return useYearReportFiltersStore();
}
