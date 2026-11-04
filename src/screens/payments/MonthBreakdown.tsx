import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { ColumnChart } from '@/components/chart/ColumnChart';
import { LegendRow } from '@/components/chart/LegendRow';
import { TotalRow } from '@/components/chart/TotalRow';
import { Card } from '@/components/layout/Card';
import { Separator } from '@/components/layout/Separator';
import { Money } from '@/components/typography/Money';
import { Typography } from '@/components/typography/Typography';
import { MONTHS, MONTHS_SHORT } from '@/utils/format';
import { round2 } from '@/utils/number';

import type { YearSeries } from './yearSeries';

const MONTH_COLUMNS = MONTHS.map((name, month) => ({ label: MONTHS_SHORT[month], name }));

type Props = {
  series: YearSeries[];
  currency: string;
  year: number;
  /** January = 0 */
  month: number | null;
  onSelectMonth: (month: number) => void;
};

/** Chart of the year with the selected month spelled out underneath. */
export function MonthBreakdown({
  series,
  currency,
  year,
  month: selectedMonth,
  onSelectMonth,
}: Props) {
  const monthRows = selectedMonth === null ? [] : series.filter((s) => s.values[selectedMonth] > 0);
  const monthPayments = monthRows.filter((s) => s.type !== 'purchase');
  const monthPurchases = monthRows.filter((s) => s.type === 'purchase');
  const monthPaymentTotal =
    selectedMonth === null
      ? 0
      : round2(monthPayments.reduce((sum, s) => sum + s.values[selectedMonth], 0));

  return (
    <Card title="По місяцях">
      <ColumnChart
        columns={MONTH_COLUMNS}
        series={series.map((s) => ({ ...s, label: s.label.toLowerCase() }))}
        currency={currency}
        selected={selectedMonth}
        onSelect={onSelectMonth}
      />

      {selectedMonth !== null ? (
        <>
          <Separator variant="card" />
          <Typography variant="subhead" weight="semibold">
            {MONTHS[selectedMonth]} {year}
          </Typography>
          <View style={styles.monthRows}>
            {monthRows.length === 0 && (
              <Typography variant="footnote" tone="secondary">
                Виплат і операцій немає
              </Typography>
            )}
            {monthPayments.map((s) => (
              <LegendRow
                key={s.color}
                color={s.color}
                label={s.label}
                value={<Money value={s.values[selectedMonth]} currency={currency} />}
              />
            ))}
            {monthPayments.length > 1 && (
              <TotalRow
                label="Усього надходжень"
                value={<Money value={monthPaymentTotal} currency={currency} />}
              />
            )}
            {monthPurchases.map((s) => (
              <LegendRow
                key={s.color}
                color={s.color}
                label={s.label}
                value={<Money value={s.values[selectedMonth]} currency={currency} />}
              />
            ))}
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  monthRows: { gap: theme.space.sm, marginTop: theme.space.sm },
}));
