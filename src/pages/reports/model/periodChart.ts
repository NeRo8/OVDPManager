import { round2 } from '@/shared/lib';

import type { MonthFlows } from './periodReport';

/** Keep monthly detail up to one year, then combine whole and partial years for a readable plot. */
export function periodChartPeriods(months: MonthFlows[]): MonthFlows[] {
  if (months.length <= 12) return months;
  const years = new Map<string, MonthFlows>();
  for (const month of months) {
    const year = month.month.slice(0, 4);
    const previous = years.get(year);
    years.set(year, {
      month: year,
      invested: round2((previous?.invested ?? 0) + month.invested),
      planned: round2((previous?.planned ?? 0) + month.planned),
      coupons: round2((previous?.coupons ?? 0) + month.coupons),
      redemptions: round2((previous?.redemptions ?? 0) + month.redemptions),
    });
  }
  return [...years.values()];
}
