import type { PortfolioStatus } from '../portfolioReportFilters';
import type { ReportScope } from '../reportScope';

export type YieldReportFiltersState = ReportScope & {
  status: PortfolioStatus;
};

/** The filters as screens and calculations use them. */
export type YieldReportFilters = YieldReportFiltersState;
