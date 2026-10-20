import { Fragment } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  LegendRow,
  MonthChart,
  SegmentedSelect,
  Section,
  Separator,
  screenContent,
  YearNav,
} from '@/shared/ui';
import { MONTHS, formatMoney, formatTotals } from '@/shared/lib';
import { PaymentRow } from '@/entities/portfolio';
import { round2 } from '@/shared/lib/number';
import { usePaymentSchedule } from '../model/usePaymentSchedule.hook';
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
    byMonth,
  } = usePaymentSchedule();

  if (!bonds && holdings.length > 0) {
    return (
      <View style={[styles.center, theme.background]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (payments.length === 0) {
    return (
      <View style={[styles.center, theme.background]}>
        <Text style={[styles.emptyText, theme.secondaryText]}>
          {holdings.length === 0
            ? 'Додайте ОВДП в гаманець, і тут з’явиться графік виплат.'
            : 'Для ваших ОВДП немає виплат після дати купівлі.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <YearNav year={year} min={firstYear} max={lastYear} onChange={setChosenYear} />

      {currencies.length > 1 && (
        <SegmentedSelect
          options={currencies.map((value) => ({ label: value, value }))}
          value={currency}
          onChange={setChosenCurrency}
        />
      )}

      {yearPayments.length === 0 ? (
        <Text style={[styles.emptyText, theme.secondaryText]}>У {year} році виплат немає.</Text>
      ) : (
        <>
          <View style={[styles.card, theme.card]}>
            <Text style={[styles.cardLabel, theme.secondaryText]}>Разом за {year} рік</Text>
            <Text style={[styles.total, theme.text]}>{formatMoney(yearTotal, currency)}</Text>
            {paidTotal > 0 && paidTotal < yearTotal && (
              <Text style={[styles.cardNote, theme.secondaryText]}>
                Виплачено {formatMoney(paidTotal, currency)} · очікується{' '}
                {formatMoney(round2(yearTotal - paidTotal), currency)}
              </Text>
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
              <Text style={[styles.selection, theme.text]}>
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
              </Text>
            )}
          </View>

          {byMonth.map((monthPayments, month) =>
            monthPayments.length === 0 ? null : (
              <Section
                key={month}
                title={`${MONTHS[month]} · ${formatTotals(
                  monthPayments.map((p) => ({ currency: p.currency, value: p.total })),
                )}`}
              >
                {monthPayments.map((payment, index) => (
                  <Fragment key={`${payment.isin}-${payment.date}-${payment.type}`}>
                    {index > 0 && <Separator />}
                    <PaymentRow payment={payment} showIsin />
                  </Fragment>
                ))}
              </Section>
            ),
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  card: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  cardLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  total: { fontSize: 32, fontWeight: '700' },
  cardNote: { fontSize: 13 },
  legend: { gap: 6, marginTop: 12 },
  selection: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
