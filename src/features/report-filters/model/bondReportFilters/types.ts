export type BondReportFiltersState = {
  /** Null, or a bond no longer in the wallet: the one nearest to maturity */
  isin: string | null;
};

/** The filters as screens and calculations use them. */
export type BondReportFilters = BondReportFiltersState;
