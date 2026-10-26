import type { WalletScope } from '@/entities/portfolio';

/** The reports with filters, by name: the route `/report-filters/[report]` takes one. */
export type ReportName =
  | 'year'
  | 'fx'
  | 'period'
  | 'yearOverYear'
  | 'redemptions'
  | 'portfolio'
  | 'structure'
  | 'yield'
  | 'bond';

/** The reports narrowed by currency and bonds; the bond report is about one bond instead. */
export type ScopedReportName = Exclude<ReportName, 'bond'>;

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

/** Redemptions still ahead, those received, or both. */
export type RedemptionTime = 'upcoming' | 'past' | 'all';

/** Bonds in circulation, those already redeemed, or both. */
export type PortfolioStatus = 'all' | 'inCirculation' | 'redeemed';

/** Every purchase of the plan, or only those already made. */
export type StructurePurchases = 'all' | 'made';

/** The currency and the bonds a report covers: a `WalletScope`, which `narrowWallet` takes. */
export type ReportScope = WalletScope;

/** Each report's saved filters. */
export type ReportFiltersState = {
  /** A null year, or one the wallet no longer spans: the current year, or the nearest it has */
  year: ReportScope & { year: number | null };
  /** UAH bond cash flows measured in one foreign currency, through the chosen past year. */
  fx: { currency: 'UAH'; isins: string[]; year: number | null; targetCurrency: 'USD' | 'EUR' };
  /** `custom` holds the own period's dates, taken from the period shown when it is chosen */
  period: ReportScope & { period: PeriodOption; custom: Period | null };
  yearOverYear: ReportScope;
  redemptions: ReportScope & { time: RedemptionTime };
  portfolio: ReportScope & { status: PortfolioStatus };
  structure: ReportScope & { purchases: StructurePurchases };
  yield: ReportScope & { status: PortfolioStatus };
  /** A null bond, or one no longer in the wallet: the one nearest to maturity */
  bond: { isin: string | null };
};
