import type { ScheduleEventType } from '@/features/payment-filters';

import type { ChartSeries } from '@/shared/ui';

import type { YearSummary } from '../model/yearSummary';

export type YearSeries = ChartSeries & {
  /** Each event type is a series of its own color */
  color: ScheduleEventType;
  /** The year's sum of the monthly values */
  total: number;
};

/** The chart series of the year, one per event type the filters let through. */
export function yearSeries(
  summary: YearSummary,
  types: readonly ScheduleEventType[],
): YearSeries[] {
  const all: YearSeries[] = [
    {
      label: 'Купони',
      color: 'coupon',
      values: summary.monthlyCoupons,
      total: summary.couponTotal,
    },
    {
      label: 'Погашення',
      color: 'redemption',
      values: summary.monthlyRedemptions,
      total: summary.redemptionTotal,
    },
    {
      label: 'Купівлі',
      color: 'purchase',
      values: summary.monthlyPurchases,
      total: summary.invested,
      direction: 'down',
    },
  ];
  return all.filter((series) => types.includes(series.color));
}
