import type { Wallet } from '@/entities/portfolio';
import { walletSpan } from './periodDates';

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
