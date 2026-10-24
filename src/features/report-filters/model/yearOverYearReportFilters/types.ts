import type { ReportScope } from '../reportScope';

/** The year-over-year report spans every year of the plan, so only its scope is filtered. */
export type YearOverYearReportFiltersState = ReportScope;

/** The filters as screens and calculations use them. */
export type YearOverYearReportFilters = YearOverYearReportFiltersState;
