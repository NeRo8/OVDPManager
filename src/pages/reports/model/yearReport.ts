import type { Wallet } from '@/entities/portfolio';
import { type CurrencyReport, periodReport } from './periodReport';

const yearOf = (date: string) => Number(date.slice(0, 4));

/** The years the report can show: from the wallet's first purchase or payment to its last. */
export function reportYears({ payments, purchaseEvents, today }: Wallet) {
  const currentYear = yearOf(today);
  const years = [...payments, ...purchaseEvents].map((event) => yearOf(event.date));
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;
  return { firstYear, lastYear, currentYear };
}

/** The wallet's purchases and payments in one calendar year, per currency. */
export function yearReport(wallet: Wallet, year: number): CurrencyReport[] {
  return periodReport(wallet, `${year}-01-01`, `${year}-12-31`);
}
