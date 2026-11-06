import { chartGrid } from '@/components/chart/chartGrid';
import { columnStacks, type ChartColumn, type ChartSeries } from '@/components/chart/columnStacks';

import { periodColumn } from './periodLabel';

export type FlowPeriod = {
  label: string;
  purchases: number;
  planned?: number;
  coupons: number;
  redemptions: number;
  sales: number;
};

/** A centered zero and the same scale on both sides, with room beyond the largest stack. */
export function horizontalFlowStacks(columns: ChartColumn[], series: ChartSeries[]) {
  const stacks = columnStacks(columns, series);
  const largest = Math.max(0, ...stacks.upTotals, ...stacks.downTotals);
  const limit = largest ? largest * 1.2 : 1;
  return { ...stacks, grid: chartGrid(-limit, limit) };
}

export function flowChartData(
  periods: FlowPeriod[],
  showPlanned: boolean,
): {
  columns: ChartColumn[];
  series: ChartSeries[];
} {
  const years = new Set(
    periods.filter(({ label }) => label.length === 7).map(({ label }) => label.slice(0, 4)),
  );
  return {
    columns: periods.map(({ label }) => {
      const column = periodColumn(label);
      return years.size > 1 && label.length === 7
        ? { ...column, label: `${column.label} ${label.slice(2, 4)}` }
        : column;
    }),
    series: [
      { label: 'Купони', color: 'coupon', values: periods.map((item) => item.coupons) },
      { label: 'Погашення', color: 'redemption', values: periods.map((item) => item.redemptions) },
      { label: 'Продажі', color: 'sale', values: periods.map((item) => item.sales) },
      {
        label: 'Купівлі',
        color: 'purchase',
        direction: 'down',
        values: periods.map((item) => item.purchases),
      },
      ...(showPlanned
        ? [
            {
              label: 'Заплановані купівлі',
              color: 'plannedPurchase' as const,
              direction: 'down' as const,
              values: periods.map((item) => item.planned ?? 0),
            },
          ]
        : []),
    ],
  };
}
