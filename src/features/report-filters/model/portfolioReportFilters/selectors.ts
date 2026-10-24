import { usePortfolioReportFiltersStore } from './store';
import type { PortfolioReportFilters } from './types';

export function usePortfolioReportFilters(): PortfolioReportFilters {
  return usePortfolioReportFiltersStore();
}
