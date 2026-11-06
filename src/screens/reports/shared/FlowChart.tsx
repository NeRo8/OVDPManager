import { ColumnChart } from '@/components/chart/ColumnChart';
import { LegendRow } from '@/components/chart/LegendRow';
import { Card } from '@/components/layout/Card';

import { periodColumn } from './periodLabel';
import { ScrollableChart } from './ScrollableChart';

type Period = {
  label: string;
  purchases: number;
  planned?: number;
  coupons: number;
  redemptions: number;
  sales: number;
};
type Props = {
  currency: string;
  periods: Period[];
  showPlanned?: boolean;
  minimumColumnWidth?: number;
};

export function FlowChart({ currency, periods, showPlanned = false, minimumColumnWidth }: Props) {
  const years = new Set(
    periods.filter(({ label }) => label.length === 7).map(({ label }) => label.slice(0, 4)),
  );
  const chart = (
    <ColumnChart
      currency={currency}
      columns={periods.map(({ label }) => {
        const column = periodColumn(label);
        return years.size > 1 && label.length === 7
          ? { ...column, label: `${column.label} ${label.slice(2, 4)}` }
          : column;
      })}
      series={[
        { label: 'Купони', color: 'coupon', values: periods.map((item) => item.coupons) },
        {
          label: 'Погашення',
          color: 'redemption',
          values: periods.map((item) => item.redemptions),
        },
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
      ]}
    />
  );
  return (
    <Card title={`Рух грошей · ${currency}`}>
      {minimumColumnWidth ? (
        <ScrollableChart count={periods.length} columnWidth={minimumColumnWidth}>
          {chart}
        </ScrollableChart>
      ) : (
        chart
      )}
      <LegendRow color="coupon" label="Купони" />
      <LegendRow color="redemption" label="Погашення" />
      <LegendRow color="sale" label="Продажі" />
      <LegendRow color="purchase" label="Купівлі" />
      {showPlanned && <LegendRow color="plannedPurchase" label="Заплановані купівлі" />}
    </Card>
  );
}
