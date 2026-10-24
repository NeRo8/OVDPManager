import type { BondReportFilters } from './bondReportFilters';

/** The saved bond while the wallet still has it, otherwise the first of `isins`. */
export function reportBondIsin({ isin }: BondReportFilters, isins: string[]): string | undefined {
  return isin !== null && isins.includes(isin) ? isin : isins[0];
}

/** Another bond than the default one counts as a filter. */
export function countBondReportFilters(filters: BondReportFilters, isins: string[]): number {
  return Number(reportBondIsin(filters, isins) !== isins[0]);
}
