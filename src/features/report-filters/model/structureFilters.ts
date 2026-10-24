import { initialState } from './structureReportFilters/store';
import type { StructureReportFilters } from './structureReportFilters';
import { countScopeFilters } from './reportScope';

/** What differs from fresh filters. */
export function countStructureReportFilters(filters: StructureReportFilters): number {
  return Number(filters.purchases !== initialState.purchases) + countScopeFilters(filters);
}
