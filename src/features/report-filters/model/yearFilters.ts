import type { Wallet } from '@/entities/portfolio';
import { walletSpan } from './periodFilters';
import { countScopeFilters } from './reportScope';
import type { YearReportFilters } from './yearReportFilters';

const yearOf = (date: string) => Number(date.slice(0, 4));

/** The years a report can show and the one it starts on. */
export type ReportYears = {
  firstYear: number;
  lastYear: number;
  /** The current year, or the nearest the wallet has */
  defaultYear: number;
};

/** From the year of the wallet's first purchase or payment to the year of its last. */
export function reportYears(wallet: Wallet): ReportYears {
  const { from, to } = walletSpan(wallet);
  const firstYear = yearOf(from);
  const lastYear = yearOf(to);
  return {
    firstYear,
    lastYear,
    defaultYear: Math.min(Math.max(yearOf(wallet.today), firstYear), lastYear),
  };
}

/** The saved year while the wallet still spans it, otherwise the default one. */
export function reportYear({ year }: YearReportFilters, years: ReportYears): number {
  return year !== null && year >= years.firstYear && year <= years.lastYear
    ? year
    : years.defaultYear;
}

/** What differs from fresh filters. */
export function countYearReportFilters(filters: YearReportFilters, years: ReportYears): number {
  return Number(reportYear(filters, years) !== years.defaultYear) + countScopeFilters(filters);
}
