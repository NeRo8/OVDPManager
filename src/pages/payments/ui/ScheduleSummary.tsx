import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MONTHS, formatCompactMoney, formatMoney } from '@/shared/lib';
import {
  Card,
  LegendRow,
  MonthChart,
  SectionTitle,
  Separator,
  Typography,
  type ChartSeries,
} from '@/shared/ui';
import type { useYearSchedule } from '../model/useYearSchedule.hook';

type Schedule = ReturnType<typeof useYearSchedule>;

type ScheduleProps = {
  schedule: Schedule;
};

/** The year at a glance: money in and money out, then the same split month by month. */
export function ScheduleSummary({ schedule }: ScheduleProps) {
  return (
    <View style={styles.summary}>
      <YearTotals schedule={schedule} />
      <MonthBreakdown schedule={schedule} />
    </View>
  );
}

/** Two tiles: payments received and money invested. Their legend rows also key the chart. */
function YearTotals({ schedule }: ScheduleProps) {
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

type TileProps = {
  label: string;
  value: string;
  children: ReactNode;
};

function Tile({ label, value, children }: TileProps) {
  return (
    <View style={styles.tile}>
      <Typography variant="overline" tone="secondary">
        {label}
      </Typography>
      {/* Half a phone width: long amounts shrink instead of wrapping. */}
      <Typography variant="title2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Typography>
      <View style={styles.tileDetails}>{children}</View>
    </View>
  );
}

/** Chart of the year with the selected month spelled out underneath. */
function MonthBreakdown({ schedule }: ScheduleProps) {
  const {
    year,
    currency,
    monthlyCoupons,
    monthlyRedemptions,
    monthlyPurchases,
    selectedMonth,
    setChosenMonth,
  } = schedule;
  const series: ChartSeries[] = [
    { label: 'Купони', color: 'coupon', values: monthlyCoupons },
    { label: 'Номінал', color: 'nominal', values: monthlyRedemptions },
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
  summary: { gap: 24 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    gap: 2,
    backgroundColor: theme.card,
  },
  tileDetails: { gap: 6, marginTop: 8 },
  progress: { gap: 4, marginTop: 2 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: theme.border },
  fill: { height: '100%', borderRadius: 2, backgroundColor: theme.accent },
  section: { gap: 6 },
  // Separator brings its own list-cell inset; pull it back to the card's padding.
  separator: { marginLeft: -16, marginVertical: 12 },
  monthRows: { gap: 6, marginTop: 6 },
}));
