import { initialState } from './portfolioReportFilters/store';
import type { PortfolioReportFilters } from './portfolioReportFilters';
import { countScopeFilters } from './reportScope';

/** What differs from fresh filters. */
export function countPortfolioReportFilters(filters: PortfolioReportFilters): number {
  return Number(filters.status !== initialState.status) + countScopeFilters(filters);
}
