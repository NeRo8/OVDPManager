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
import type { ScheduleProps } from './schedule.types';

/** Chart of the year with the selected month spelled out underneath. */
export function MonthBreakdown({ schedule }: ScheduleProps) {
  const {
    year,
    currency,
    monthlyCoupons,
    monthlyRedemptions,
    monthlyPurchases,
    selectedMonth,
    setChosenMonth,
  } = schedule;
  if (!currency) return null;
  const series: ChartSeries[] = [
    { label: 'Купони', color: 'coupon', values: monthlyCoupons },
    { label: 'Погашення', color: 'nominal', values: monthlyRedemptions },
    { label: 'Покупки', color: 'purchase', values: monthlyPurchases, direction: 'down' },
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
          onSelect={(month) => setChosenMonth({ year, month })}
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
                  Виплат і покупок немає
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
