import { StyleSheet, View } from 'react-native';

import {
  EmptyState,
  LegendRow,
  MonthChart,
  SegmentedSelect,
  Typography,
  YearNav,
} from '@/shared/ui';
import { MONTHS, formatMoney } from '@/shared/lib';
import { round2 } from '@/shared/lib/number';
import { usePaymentSchedule } from '../model/usePaymentSchedule.hook';
import { PaymentSectionList } from './PaymentSectionList';
import { useColors, themeStyles } from '@/shared/theme';

export default function ScheduleScreen() {
  const colors = useColors();
  const theme = themeStyles;
  const {
    holdings,
    bonds,
    payments,
    firstYear,
    lastYear,
    year,
    setChosenYear,
    currencies,
    currency,
    setChosenCurrency,
    yearPayments,
    monthlyCoupons,
    monthlyRedemptions,
    couponTotal,
    redemptionTotal,
    yearTotal,
    paidTotal,
    selectedMonth,
    setChosenMonth,
    sections,
  } = usePaymentSchedule();

  if (!bonds && holdings.length > 0) return <EmptyState loading />;

  if (payments.length === 0) {
    return (
      <EmptyState
        message={
          holdings.length === 0
            ? 'Додайте ОВДП в гаманець, і тут з’явиться графік виплат.'
            : 'Для ваших ОВДП немає виплат після дати купівлі.'
        }
      />
    );
  }

  return (
    <PaymentSectionList
      sections={sections}
      ListHeaderComponent={
        <View style={styles.header}>
          <YearNav year={year} min={firstYear} max={lastYear} onChange={setChosenYear} />

          {currencies.length > 1 && (
            <SegmentedSelect
              options={currencies.map((value) => ({ label: value, value }))}
              value={currency}
              onChange={setChosenCurrency}
            />
          )}

          {yearPayments.length > 0 && (
            <View style={[styles.card, theme.card]}>
              <Typography variant="overline" tone="secondary">
                Разом за {year} рік
              </Typography>
              <Typography variant="display" tabular>
                {formatMoney(yearTotal, currency)}
              </Typography>
              {paidTotal > 0 && paidTotal < yearTotal && (
                <Typography variant="caption1" tone="secondary">
                  Виплачено {formatMoney(paidTotal, currency)} · очікується{' '}
                  {formatMoney(round2(yearTotal - paidTotal), currency)}
                </Typography>
              )}

              {/* Breakdown doubles as the chart legend: swatch + name + amount. */}
              <View style={styles.legend}>
                <LegendRow
                  color={colors.seriesCoupon}
                  label="Купони (проценти)"
                  value={formatMoney(couponTotal, currency)}
                />
                <LegendRow
                  color={colors.seriesNominal}
                  label="Повернення номіналу"
                  value={formatMoney(redemptionTotal, currency)}
                />
              </View>

              <MonthChart
                series={[
                  { label: 'купони', color: colors.seriesCoupon, values: monthlyCoupons },
                  { label: 'номінал', color: colors.seriesNominal, values: monthlyRedemptions },
                ]}
                currency={currency}
                selected={selectedMonth}
                onSelect={(month) => setChosenMonth({ year, month })}
              />

              {selectedMonth !== null && (
                <Typography variant="footnote" align="center" style={styles.selection}>
                  {MONTHS[selectedMonth]}:{' '}
                  {monthlyCoupons[selectedMonth] + monthlyRedemptions[selectedMonth] === 0
                    ? 'виплат немає'
                    : [
                        monthlyCoupons[selectedMonth] > 0 &&
                          `купони ${formatMoney(monthlyCoupons[selectedMonth], currency)}`,
                        monthlyRedemptions[selectedMonth] > 0 &&
                          `номінал ${formatMoney(monthlyRedemptions[selectedMonth], currency)}`,
                      ]
                        .filter(Boolean)
                        .join(' + ')}
                </Typography>
              )}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <Typography variant="subhead" tone="secondary" align="center" style={styles.emptyList}>
          У {year} році виплат немає.
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 24 },
  emptyList: { marginTop: 28 },
  card: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  legend: { gap: 6, marginTop: 12 },
  selection: { marginTop: 8 },
});
