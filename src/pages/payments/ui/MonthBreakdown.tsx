import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MONTHS, MONTHS_SHORT, formatMoney } from '@/shared/lib';
import {
  Card,
  ColumnChart,
  LegendRow,
  SectionTitle,
  Separator,
  TotalRow,
  Typography,
} from '@/shared/ui';
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
  const monthPayments = monthRows.filter((s) => s.color !== 'purchase');
  const monthPurchases = monthRows.filter((s) => s.color === 'purchase');

  return (
    <View style={styles.section}>
      <SectionTitle title="По місяцях" />
      <Card>
        <ColumnChart
          columns={MONTH_COLUMNS}
          series={series.map((s) => ({ ...s, label: s.label.toLowerCase() }))}
          currency={currency}
          selected={selectedMonth}
          onSelect={onSelectMonth}
        />

        {selectedMonth !== null ? (
          <>
            <View style={styles.separator}>
              <Separator />
            </View>
            <Typography variant="subhead" weight="semibold">
              {MONTHS[selectedMonth]} {year}
            </Typography>
            <View style={styles.monthRows}>
              {monthRows.length === 0 && (
                <Typography variant="footnote" tone="secondary">
                  Виплат і купівель немає
                </Typography>
              )}
              {monthPayments.map((s) => (
                <LegendRow
                  key={s.color}
                  color={s.color}
                  label={s.label}
                  value={formatMoney(s.values[selectedMonth], currency)}
                />
              ))}
              {monthPayments.length > 1 && (
                <TotalRow
                  label="Усього виплат"
                  value={formatMoney(
                    monthPayments.reduce((sum, s) => sum + s.values[selectedMonth], 0),
                    currency,
                  )}
                />
              )}
              {monthPurchases.map((s) => (
                <LegendRow
                  key={s.color}
                  color={s.color}
                  label={s.label}
                  value={formatMoney(s.values[selectedMonth], currency)}
                />
              ))}
            </View>
          </>
        ) : (
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
