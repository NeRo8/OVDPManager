import { useRedemptionsReportFiltersStore } from './store';
import type { RedemptionsReportFilters } from './types';

export function useRedemptionsReportFilters(): RedemptionsReportFilters {
  return useRedemptionsReportFiltersStore();
}
