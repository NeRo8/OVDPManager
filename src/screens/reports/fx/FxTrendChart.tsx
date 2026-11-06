import { LegendRow } from '@/components/chart/LegendRow';
import { LineChart } from '@/components/chart/LineChart';
import { Card } from '@/components/layout/Card';
import { formatMoney, MONTHS_SHORT } from '@/utils/format';

import type { fxTrend } from './fxReport';

type Props = { points: ReturnType<typeof fxTrend>; currency: string; period: 'all' | 'year' };

export function FxTrendChart({ points, currency, period }: Props) {
  if (!points.length || points.some((point) => point.value === null)) return null;
  const values = points.map((point) => point.value ?? 0);
  const invested = points.map((point) => point.invested);
  const differences = values.map((value, index) => value - invested[index]);
  const series =
    period === 'all'
      ? [{ label: 'Різниця', color: 'redemption' as const, values: differences }]
      : [
          { label: 'Вкладено', color: 'purchase' as const, values: invested },
          { label: 'Залишок і надходження', color: 'redemption' as const, values },
        ];
  const numbers = series.flatMap((item) => item.values);
  const labels = points.map(
    (point) => `${MONTHS_SHORT[Number(point.date.slice(5, 7)) - 1]} ${point.date.slice(2, 4)}`,
  );
  return (
    <Card
      title={`Динаміка у валюті · ${currency}`}
      footer="Залишок оцінено за собівартістю і курсом НБУ на кінець місяця, а не за ринковою ціною. Надходження можуть бути повторно інвестовані."
    >
      <LineChart
        labels={labels}
        names={points.map((point) => point.date)}
        series={series}
        currency={currency}
        min={Math.min(0, ...numbers)}
        max={Math.max(0, ...numbers)}
        sparseLabels
        accessibilityLabel={`Динаміка валютного еквівалента; останнє значення ${formatMoney(numbers.at(-1) ?? 0, currency)}.`}
      />
      {period === 'all' ? (
        <LegendRow color="redemption" label="Різниця з вкладеним" />
      ) : (
        <>
          <LegendRow color="purchase" label="Вкладено" />
          <LegendRow color="redemption" label="Залишок і надходження" />
        </>
      )}
    </Card>
  );
}
