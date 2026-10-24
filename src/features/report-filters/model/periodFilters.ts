import type { Wallet } from '@/entities/portfolio';
import { addDaysISO, addMonthsISO, monthRange, quarterRange } from '@/shared/lib';
import { initialState } from './periodReportFilters/store';
import type { Period, PeriodOption, PeriodReportFilters } from './periodReportFilters';
import { countScopeFilters } from './reportScope';

/** In the order the filters screen lists them. */
export const PERIOD_OPTIONS: PeriodOption[] = [
  'month',
  'lastMonth',
  'quarter',
  'lastQuarter',
  'yearToDate',
  'last12Months',
  'plan',
  'custom',
];

/** From the wallet's first purchase or payment to its last; today alone when it has none. */
export function walletSpan({ payments, purchaseEvents, today }: Wallet): Period {
  const dates = [...payments, ...purchaseEvents].map((event) => event.date).sort();
  return { from: dates[0] ?? today, to: dates.at(-1) ?? today };
}

/**
 * The dates of a period. Calendar months and quarters are whole, payments still ahead included;
 * the year to date and the last 12 months end today. The own period without dates yet is the
 * default one.
 */
export function periodDates(option: PeriodOption, wallet: Wallet, custom: Period | null): Period {
  const { today } = wallet;
  switch (option) {
    case 'month':
      return monthRange(today);
    case 'lastMonth':
      return monthRange(today, -1);
    case 'quarter':
      return quarterRange(today);
    case 'lastQuarter':
      return quarterRange(today, -1);
    case 'yearToDate':
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case 'last12Months':
      return { from: addDaysISO(addMonthsISO(today, -12), 1), to: today };
    case 'plan':
      return walletSpan(wallet);
    case 'custom':
      return custom ?? periodDates(initialState.period, wallet, null);
  }
}

/** What differs from fresh filters. */
export function countPeriodReportFilters(filters: PeriodReportFilters): number {
  return Number(filters.period !== initialState.period) + countScopeFilters(filters);
}
