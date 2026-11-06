import { LegendRow } from '@/components/chart/LegendRow';
import { LineChart } from '@/components/chart/LineChart';
import { Card } from '@/components/layout/Card';
import type { ReportCapitalChart } from '@/screens/reports/shared/reportSection';
import { formatDate } from '@/utils/date';

type Props = { chart: ReportCapitalChart; footer?: string };

export function BondFlowChart({ chart, footer }: Props) {
  const values = chart.series.flatMap((item) => item.values);
  return (
    <Card title={`Вкладення та надходження · ${chart.currency}`} footer={footer}>
      <LineChart
        labels={chart.dates.map(
          (date) => `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(2, 4)}`,
        )}
        names={chart.dates.map(formatDate)}
        positions={chart.positions}
        series={chart.series}
        currency={chart.currency}
        min={0}
        max={Math.max(0, ...values)}
        sparseLabels
        step
        accessibilityLabel={`Залишок вкладених коштів та накопичені надходження, ${chart.currency}. Деталі операцій і виплат наведено нижче.`}
      />
      {chart.series.map((item) => (
        <LegendRow key={item.color} color={item.color} label={item.label} />
      ))}
    </Card>
  );
}
