import { useReportFiltersStore } from './store';
import type { ReportFiltersState, ReportName } from './types';

export function useReportFilters<R extends ReportName>(report: R): ReportFiltersState[R] {
  return useReportFiltersStore((state) => state[report]);
}
