import type { ReportScope } from '../reportScope';

/** Redemptions still ahead, those received, or both. */
export type RedemptionTime = 'upcoming' | 'past' | 'all';

export type RedemptionsReportFiltersState = ReportScope & {
  time: RedemptionTime;
};

/** The filters as screens and calculations use them. */
export type RedemptionsReportFilters = RedemptionsReportFiltersState;
