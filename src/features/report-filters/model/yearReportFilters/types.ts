import type { ReportScope } from '../reportScope';

export type YearReportFiltersState = ReportScope & {
  /** Null, or a year the wallet no longer spans: the current year, or the nearest it has */
  year: number | null;
};

/** The filters as screens and calculations use them. */
export type YearReportFilters = YearReportFiltersState;
