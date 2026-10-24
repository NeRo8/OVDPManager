import { initialState } from './redemptionsReportFilters/store';
import type { RedemptionsReportFilters } from './redemptionsReportFilters';
import { countScopeFilters } from './reportScope';

/** What differs from fresh filters. */
export function countRedemptionsReportFilters(filters: RedemptionsReportFilters): number {
  return Number(filters.time !== initialState.time) + countScopeFilters(filters);
}
