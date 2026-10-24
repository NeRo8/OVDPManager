import type { ReportScope } from '../reportScope';

/** Bonds in circulation, those already redeemed, or both. */
export type PortfolioStatus = 'all' | 'inCirculation' | 'redeemed';

export type PortfolioReportFiltersState = ReportScope & {
  status: PortfolioStatus;
};

/** The filters as screens and calculations use them. */
export type PortfolioReportFilters = PortfolioReportFiltersState;
