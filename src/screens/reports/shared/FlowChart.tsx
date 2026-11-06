import { ColumnChart } from '@/components/chart/ColumnChart';
import { LegendRow } from '@/components/chart/LegendRow';
import { Card } from '@/components/layout/Card';

import { flowChartData, type FlowPeriod } from './flowChartData';
import { ScrollableChart } from './ScrollableChart';

type Props = {
  currency: string;
  periods: FlowPeriod[];
  showPlanned?: boolean;
  minimumColumnWidth?: number;
};

export function FlowChart({ currency, periods, showPlanned = false, minimumColumnWidth }: Props) {
  const { columns, series } = flowChartData(periods, showPlanned);
  const chart = <ColumnChart currency={currency} columns={columns} series={series} />;
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
