import { formatAmount } from '@/utils/format';
import { round2 } from '@/utils/number';

import { periodColumn } from './periodLabel';
import type { ReportSection } from './reportSection';

type FlowPeriod = {
  label: string;
  purchases: number;
  planned?: number;
  coupons: number;
  redemptions: number;
  sales: number;
};

/** Split amounts into two tables so each value has room. */
export function flowTables(
  currency: string,
  periods: FlowPeriod[],
  monthOnly = false,
): ReportSection[] {
  const money = (value: number) => formatAmount(round2(value));
  const periodLabel = (label: string) => {
    const short = periodColumn(label).label;
    return !monthOnly && label.length === 7 ? `${short} ${label.slice(0, 4)}` : short;
  };
  return [
    {
      title: `Купівлі та продажі за періодами · ${currency}`,
      rows: [],
      chart: {
        title: 'Надходження',
        currency,
        bars: periods.map((period) => ({
          label: periodLabel(period.label),
          value: round2(period.coupons + period.redemptions + period.sales),
        })),
      },
      table: {
        currency,
        firstColumn: monthOnly ? 'Міс' : 'Період',
        columns: ['Купівлі', 'Продажі'],
        rows: periods.map((period) => ({
          label: periodLabel(period.label),
          values: [money(period.purchases + (period.planned ?? 0)), money(period.sales)],
        })),
      },
    },
    {
      title: `Купони та погашення за періодами · ${currency}`,
      rows: [],
      table: {
        currency,
        firstColumn: monthOnly ? 'Міс' : 'Період',
        columns: ['Купони', 'Погашення'],
        rows: periods.map((period) => ({
          label: periodLabel(period.label),
          values: [money(period.coupons), money(period.redemptions)],
        })),
      },
    },
  ];
}
