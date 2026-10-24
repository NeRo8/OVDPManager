import type { ReportScope } from '../reportScope';

/** Bonds with payments still ahead, those already redeemed, or both. */
export type PortfolioStatus = 'all' | 'active' | 'redeemed';

export type PortfolioReportFiltersState = ReportScope & {
  status: PortfolioStatus;
};

/** The filters as screens and calculations use them. */
export type PortfolioReportFilters = PortfolioReportFiltersState;
