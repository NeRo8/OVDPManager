import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatCompactMoney, formatMoney } from '@/shared/lib';
import { LegendRow, Typography } from '@/shared/ui';
import type { ScheduleProps } from './schedule.types';
import { Tile } from './Tile';

/** Two tiles: payments received and money invested. Their legend rows also key the chart. */
export function YearTotals({ schedule }: ScheduleProps) {
  const {
    currency,
    yearTotal,
    paidTotal,
    couponTotal,
    redemptionTotal,
    purchasedTotal,
    averageMonthlyPurchase,
    yearPurchases,
  } = schedule;
  if (!currency) return null;
  const paidPercent = yearTotal > 0 ? Math.round((paidTotal / yearTotal) * 100) : 0;
  const purchaseCount = yearPurchases.length;

  return (
    <View style={styles.tiles}>
      <Tile label="Виплати" value={formatMoney(yearTotal, currency)}>
        {yearTotal > 0 ? (
          <>
            <LegendRow
              color="coupon"
              label="Купони"
              value={formatCompactMoney(couponTotal, currency)}
            />
            <LegendRow
              color="nominal"
              label="Номінал"
              value={formatCompactMoney(redemptionTotal, currency)}
            />
            {paidPercent > 0 && paidPercent < 100 && (
              <View style={styles.progress}>
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Виплачено"
                  accessibilityValue={{ min: 0, max: 100, now: paidPercent }}
                  style={styles.track}
                >
                  <View style={[styles.fill, { width: `${paidPercent}%` }]} />
                </View>
                <Typography variant="caption1" tone="secondary">
                  виплачено {paidPercent} %
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

      <Tile label="Інвестовано" value={formatMoney(purchasedTotal, currency)}>
        {purchaseCount > 0 ? (
          <>
            <LegendRow color="purchase" label="Покупки" value={`${purchaseCount}`} />
            <Typography variant="caption1" tone="secondary">
              ≈ {formatCompactMoney(averageMonthlyPurchase, currency)} на місяць
            </Typography>
          </>
        ) : (
          <Typography variant="footnote" tone="secondary">
            Покупок не було
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
