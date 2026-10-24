import type { ReportScope } from '../reportScope';

/** Every purchase of the plan, or only those already made. */
export type StructurePurchases = 'all' | 'made';

export type StructureReportFiltersState = ReportScope & {
  purchases: StructurePurchases;
};

/** The filters as screens and calculations use them. */
export type StructureReportFilters = StructureReportFiltersState;
