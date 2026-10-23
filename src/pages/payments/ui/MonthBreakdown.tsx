import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MONTHS, formatMoney } from '@/shared/lib';
import {
  Card,
  LegendRow,
  MonthChart,
  SectionTitle,
  Separator,
  Typography,
  type ChartSeries,
} from '@/shared/ui';
import type { YearSummary } from '../model/yearSummary';

/** Chart of the year with the selected month spelled out underneath. */
type Props = {
  summary: YearSummary;
  year: number;
  /** January = 0 */
  month: number | null;
  onSelectMonth: (month: number) => void;
};

export function MonthBreakdown({ summary, year, month: selectedMonth, onSelectMonth }: Props) {
  const { currency, monthlyCoupons, monthlyRedemptions, monthlyPurchases } = summary;
  const series: ChartSeries[] = [
    { label: 'Купони', color: 'coupon', values: monthlyCoupons },
    { label: 'Погашення', color: 'redemption', values: monthlyRedemptions },
    { label: 'Купівлі', color: 'purchase', values: monthlyPurchases, direction: 'down' },
  ];
  const monthRows = selectedMonth === null ? [] : series.filter((s) => s.values[selectedMonth] > 0);

  return (
    <View style={styles.section}>
      <SectionTitle title="По місяцях" />
      <Card>
        <MonthChart
          series={series.map((s) => ({ ...s, label: s.label.toLowerCase() }))}
          currency={currency}
          selected={selectedMonth}
          onSelect={onSelectMonth}
        />

        {selectedMonth !== null && (
          <>
            <View style={styles.separator}>
              <Separator />
            </View>
            <Typography variant="subhead" weight="semibold">
              {MONTHS[selectedMonth]} {year}
            </Typography>
            <View style={styles.monthRows}>
              {monthRows.length > 0 ? (
                monthRows.map((s) => (
                  <LegendRow
                    key={s.label}
                    color={s.color}
                    label={s.label}
                    value={formatMoney(s.values[selectedMonth], currency)}
                  />
                ))
              ) : (
                <Typography variant="footnote" tone="secondary">
                  Виплат і купівель немає
                </Typography>
              )}
            </View>
          </>
        )}
        {selectedMonth === null && (
          <Typography variant="caption1" tone="secondary" align="center">
            Торкніться місяця, щоб побачити деталі
          </Typography>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  monthRows: { gap: theme.space.sm, marginTop: theme.space.sm },
}));
