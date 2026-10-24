import { useStructureReportFiltersStore } from './store';
import type { StructureReportFilters } from './types';

export function useStructureReportFilters(): StructureReportFilters {
  return useStructureReportFiltersStore();
}
