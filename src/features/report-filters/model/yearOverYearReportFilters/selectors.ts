import { useYearOverYearReportFiltersStore } from './store';
import type { YearOverYearReportFilters } from './types';

export function useYearOverYearReportFilters(): YearOverYearReportFilters {
  return useYearOverYearReportFiltersStore();
}
