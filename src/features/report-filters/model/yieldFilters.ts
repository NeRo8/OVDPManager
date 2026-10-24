import { countScopeFilters } from './reportScope';
import { initialState } from './yieldReportFilters/store';
import type { YieldReportFilters } from './yieldReportFilters';

/** What differs from fresh filters. */
export function countYieldReportFilters(filters: YieldReportFilters): number {
  return Number(filters.status !== initialState.status) + countScopeFilters(filters);
}
