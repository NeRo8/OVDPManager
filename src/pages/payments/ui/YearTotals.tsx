import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatCompactMoney, formatMoney } from '@/shared/lib';
import { LegendRow, Typography } from '@/shared/ui';
import type { YearSummary } from '../model/yearSummary';
import { Tile } from './Tile';

/** Two tiles: payments received and money invested. Their legend rows also key the chart. */
type Props = {
  summary: YearSummary;
};

export function YearTotals({ summary }: Props) {
  const {
    currency,
    totalPayments,
    received,
    couponTotal,
    redemptionTotal,
    invested,
    purchaseCount,
    averageMonthlyPurchase,
  } = summary;
  const receivedPercent = totalPayments > 0 ? Math.round((received / totalPayments) * 100) : 0;

  return (
    <View style={styles.tiles}>
      <Tile label="Виплати" value={formatMoney(totalPayments, currency)}>
        {totalPayments > 0 ? (
          <>
            <LegendRow
              color="coupon"
              label="Купони"
              value={formatCompactMoney(couponTotal, currency)}
            />
            <LegendRow
              color="redemption"
              label="Погашення"
              value={formatCompactMoney(redemptionTotal, currency)}
            />
            {receivedPercent > 0 && receivedPercent < 100 && (
              <View style={styles.progress}>
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Отримано"
                  accessibilityValue={{ min: 0, max: 100, now: receivedPercent }}
                  style={styles.track}
                >
                  <View style={[styles.fill, { width: `${receivedPercent}%` }]} />
                </View>
                <Typography variant="caption1" tone="secondary">
                  отримано {receivedPercent} %
                </Typography>
              </View>
            )}
          </>
        ) : (
          <Typography variant="footnote" tone="secondary">
            Виплат немає
          </Typography>
        )}
      </Tile>

      <Tile label="Вкладено" value={formatMoney(invested, currency)}>
        {purchaseCount > 0 ? (
          <>
            <LegendRow color="purchase" label="Купівлі" value={`${purchaseCount}`} />
            <Typography variant="caption1" tone="secondary">
              ≈ {formatCompactMoney(averageMonthlyPurchase, currency)} на місяць
            </Typography>
          </>
        ) : (
          <Typography variant="footnote" tone="secondary">
            Купівель не було
          </Typography>
        )}
      </Tile>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Stacked: at half a phone width the legend labels wrap.
  tiles: { gap: theme.space.md },
  progress: { gap: theme.space.xs, marginTop: theme.space.xxs },
  track: {
    height: 4,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    backgroundColor: theme.border,
  },
  fill: { height: '100%', borderRadius: theme.radius.full, backgroundColor: theme.accent },
}));
