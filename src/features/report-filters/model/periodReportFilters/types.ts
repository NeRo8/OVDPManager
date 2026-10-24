import type { ReportScope } from '../reportScope';

/** Two days, both included, YYYY-MM-DD. */
export type Period = { from: string; to: string };

/** A period counted from today or from the plan, or the user's own dates. */
export type PeriodOption =
  | 'month'
  | 'lastMonth'
  | 'quarter'
  | 'lastQuarter'
  | 'yearToDate'
  | 'last12Months'
  | 'plan'
  | 'custom';

export type PeriodReportFiltersState = ReportScope & {
  period: PeriodOption;
  /** The dates of the own period; taken from the period shown when it is chosen */
  custom: Period | null;
};

/** The filters as screens and calculations use them. */
export type PeriodReportFilters = PeriodReportFiltersState;
