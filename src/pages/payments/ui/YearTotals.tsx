import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatMoney, plural } from '@/shared/lib';
import { Card, LegendRow, Separator, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { YearSummary } from '../model/yearSummary';
import type { YearSeries } from './yearSeries';

type Props = {
  summary: YearSummary;
  series: YearSeries[];
};

/** The year's sums: payments, how much of them has come in, and the money invested. */
export function YearTotals({ summary, series }: Props) {
  const { currency, totalPayments, received, purchaseCount, averageMonthlyPurchase } = summary;
  const payments = series.filter((s) => s.color !== 'purchase');
  const purchases = series.filter((s) => s.color === 'purchase');
  const receivedPercent = totalPayments > 0 ? Math.round((received / totalPayments) * 100) : 0;

  return (
    <Card title="За рік">
      {payments.length > 0 && (
        <View style={styles.rows}>
          {payments.map((s) => (
            <LegendRow
              key={s.color}
              color={s.color}
              label={s.label}
              value={formatMoney(s.total, currency)}
            />
          ))}
          {payments.length > 1 && (
            <TotalRow label="Усього виплат" value={formatMoney(totalPayments, currency)} />
          )}
          {receivedPercent > 0 && receivedPercent < 100 && (
            <ShareBar
              percent={receivedPercent}
              accessibilityLabel="Отримано"
              caption={`отримано ${receivedPercent} %`}
            />
          )}
        </View>
      )}

      {payments.length > 0 && purchases.length > 0 && <Separator variant="card" />}

      {purchases.length > 0 && (
        <View style={styles.rows}>
          {purchases.map((s) => (
            <LegendRow
              key={s.color}
              color={s.color}
              label={s.label}
              value={formatMoney(s.total, currency)}
            />
          ))}
          {purchaseCount > 0 && (
            <Typography variant="caption1" tone="secondary">
              {purchaseCount} {plural(purchaseCount, 'купівля', 'купівлі', 'купівель')}, ≈{' '}
              {formatMoney(averageMonthlyPurchase, currency)} на місяць
            </Typography>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  rows: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
}));
