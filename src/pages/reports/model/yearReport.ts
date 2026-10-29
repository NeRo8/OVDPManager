import type { Wallet } from '@/entities/portfolio';

import { type CurrencyReport, periodReport } from './periodReport';

/** The wallet's purchases and payments in one calendar year, per currency. */
export function yearReport(wallet: Wallet, year: number): CurrencyReport[] {
  return periodReport(wallet, `${year}-01-01`, `${year}-12-31`);
}
