import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney, MONTHS_SHORT } from '@/shared/lib';
import { Card, type ChartSeries, ColumnChart, LegendRow } from '@/shared/ui';

import { periodChartPeriods } from '../model/periodChart';
import type { CurrencyReport } from '../model/periodReport';

type Props = { report: CurrencyReport };

/** Cash flows by month, or by year when a custom period is longer than twelve months. */
export function PeriodFlowsChart({ report }: Props) {
  const byYear = report.months.length > 12;
  const periods = periodChartPeriods(report.months);
  const columns = periods.map(({ month }) => ({
    label: byYear ? month : MONTHS_SHORT[Number(month.slice(5, 7)) - 1],
    name: byYear ? `${month} рік` : month,
  }));
  const series: ChartSeries[] = [
    { label: 'купони', color: 'coupon', values: periods.map(({ coupons }) => coupons) },
    {
      label: 'погашення',
      color: 'redemption',
      values: periods.map(({ redemptions }) => redemptions),
    },
    {
      label: 'купівлі',
      color: 'purchase',
      direction: 'down',
      values: periods.map(({ invested }) => invested),
    },
  ];

  return (
    <Card
      title={`Грошові потоки по ${byYear ? 'роках' : 'місяцях'} · ${CURRENCY_NAMES[report.currency]}`}
    >
      <View style={styles.content}>
        <ColumnChart columns={columns} series={series} currency={report.currency} />
        <View style={styles.legend}>
          <LegendRow
            color="coupon"
            label="Купони"
            value={formatMoney(report.coupons, report.currency)}
          />
          <LegendRow
            color="redemption"
            label="Погашення"
            value={formatMoney(report.redemptions, report.currency)}
          />
          <LegendRow
            color="purchase"
            label="Купівлі"
            value={formatMoney(report.invested, report.currency)}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space.lg },
  legend: { gap: theme.space.sm },
}));
