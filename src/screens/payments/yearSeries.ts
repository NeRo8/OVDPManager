import type { ChartSeries } from '@/components/chart/ColumnChart';
import type { ScheduleEventType } from '@/stores/operations';
import type { SeriesColor } from '@/theme/series';
import { round2 } from '@/utils/number';

import type { YearSummary } from './yearSummary';

export type YearSeries = ChartSeries & {
  /** The event type the series shows; operations come as two series, made and planned */
  type: ScheduleEventType;
  color: SeriesColor;
  /** The year's sum of the monthly values */
  total: number;
};

/**
 * The chart series of the year, one per event type the filters let through; planned operations are
 * a series of their own color, there only when the year has some.
 */
export function yearSeries(
  summary: YearSummary,
  types: readonly ScheduleEventType[],
): YearSeries[] {
  const all: YearSeries[] = [
    ...(summary.saleTotal > 0
      ? [
          {
            label: 'Продажі',
            type: 'sale' as const,
            color: 'sale' as const,
            values: summary.monthlySales,
            total: summary.saleTotal,
          },
        ]
      : []),
    {
      label: 'Купони',
      type: 'coupon',
      color: 'coupon',
      values: summary.monthlyCoupons,
      total: summary.couponTotal,
    },
    {
      label: 'Погашення',
      type: 'redemption',
      color: 'redemption',
      values: summary.monthlyRedemptions,
      total: summary.redemptionTotal,
    },
    {
      label: 'Купівлі',
      type: 'purchase',
      color: 'purchase',
      values: summary.monthlyPurchases,
      total: round2(summary.invested - summary.planned),
      direction: 'down',
    },
    ...(summary.planned > 0
      ? [
          {
            label: 'Заплановані купівлі',
            type: 'purchase' as const,
            color: 'plannedPurchase' as const,
            values: summary.monthlyPlannedPurchases,
            total: summary.planned,
            direction: 'down' as const,
          },
        ]
      : []),
  ];
  // A year of only planned operations has no row of made ones at zero.
  return all.filter(
    (series) =>
      types.includes(series.type) &&
      !(series.color === 'purchase' && series.total === 0 && summary.planned > 0),
  );
}
