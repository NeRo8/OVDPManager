import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Fragment, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthChart } from '@/components/month-chart';
import { PaymentRow, Section, Separator, screenContent } from '@/components/ui';
import { MONTHS, formatMoney, formatTotals, toISODate } from '@/lib/format';
import { useHoldings } from '@/lib/holdings';
import { type PositionPayment, portfolioPayments, round2 } from '@/lib/ovdp';
import { useBonds } from '@/lib/use-bonds';
import { useColors } from '@/theme/colors';

const CURRENCY_ORDER = ['UAH', 'USD', 'EUR'];

function sum(payments: PositionPayment[]) {
  return round2(payments.reduce((total, p) => total + p.total, 0));
}

export default function ScheduleScreen() {
  const colors = useColors();
  const holdings = useHoldings();
  const { bonds, byIsin } = useBonds();
  const today = toISODate(new Date());
  const currentYear = Number(today.slice(0, 4));

  const payments = useMemo(
    () => portfolioPayments(holdings, byIsin, today),
    [holdings, byIsin, today],
  );
  const firstYear = payments.length ? Number(payments[0].date.slice(0, 4)) : currentYear;
  const lastYear = payments.length ? Number(payments.at(-1)!.date.slice(0, 4)) : currentYear;

  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  // Keyed by year so switching years falls back to that year's default month.
  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);

  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearPayments = payments.filter((p) => p.date.startsWith(`${year}-`));

  const currencies = [...new Set(yearPayments.map((p) => p.currency))].sort(
    (a, b) => CURRENCY_ORDER.indexOf(a) - CURRENCY_ORDER.indexOf(b),
  );
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];

  const coupons = yearPayments.filter((p) => p.type === 'coupon' && p.currency === currency);
  const redemptions = yearPayments.filter(
    (p) => p.type === 'redemption' && p.currency === currency,
  );
  const inMonth = (month: number) => (p: PositionPayment) =>
    Number(p.date.slice(5, 7)) - 1 === month;
  const monthlyCoupons = MONTHS.map((_, month) => sum(coupons.filter(inMonth(month))));
  const monthlyRedemptions = MONTHS.map((_, month) => sum(redemptions.filter(inMonth(month))));

  const couponTotal = sum(coupons);
  const redemptionTotal = sum(redemptions);
  const yearTotal = round2(couponTotal + redemptionTotal);
  const paidTotal = sum([...coupons, ...redemptions].filter((p) => p.isPaid));

  // Default to the month of the next payment, else the first month that has one.
  const defaultMonth = (() => {
    const all = [...coupons, ...redemptions].sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = all.find((p) => !p.isPaid) ?? all[0];
    return upcoming ? Number(upcoming.date.slice(5, 7)) - 1 : null;
  })();
  const selectedMonth = chosenMonth?.year === year ? chosenMonth.month : defaultMonth;

  // The currency switch applies to the whole screen, so the list matches the chart.
  const byMonth = MONTHS.map((_, month) =>
    yearPayments.filter((p) => p.currency === currency && inMonth(month)(p)),
  );

  if (!bonds && holdings.length > 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (payments.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          {holdings.length === 0
            ? 'Додайте ОВДП в гаманець, і тут з’явиться графік виплат.'
            : 'Для ваших ОВДП немає виплат після дати купівлі.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.yearNav}>
        <YearArrow
          label="‹"
          accessibilityLabel="Попередній рік"
          disabled={year <= firstYear}
          onPress={() => setChosenYear(year - 1)}
        />
        <Text style={[styles.year, { color: colors.text }]}>{year}</Text>
        <YearArrow
          label="›"
          accessibilityLabel="Наступний рік"
          disabled={year >= lastYear}
          onPress={() => setChosenYear(year + 1)}
        />
      </View>

      {currencies.length > 1 && (
        <SegmentedControl
          values={currencies}
          selectedIndex={currencies.indexOf(currency)}
          onValueChange={setChosenCurrency}
        />
      )}

      {yearPayments.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          У {year} році виплат немає.
        </Text>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.secondaryText }]}>
              Разом за {year} рік
            </Text>
            <Text style={[styles.total, { color: colors.text }]}>
              {formatMoney(yearTotal, currency)}
            </Text>
            {paidTotal > 0 && paidTotal < yearTotal && (
              <Text style={[styles.cardNote, { color: colors.secondaryText }]}>
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
              coupons={monthlyCoupons}
              redemptions={monthlyRedemptions}
              currency={currency}
              selected={selectedMonth}
              onSelect={(month) => setChosenMonth({ year, month })}
            />

            {selectedMonth !== null && (
              <Text style={[styles.selection, { color: colors.text }]}>
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

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.secondaryText }]}>{label}</Text>
      <Text style={[styles.legendValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function YearArrow({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: colors.card, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.arrowText, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  yearNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  year: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'center',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 24, fontWeight: '500', lineHeight: 28 },
  card: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  cardLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  total: { fontSize: 32, fontWeight: '700' },
  cardNote: { fontSize: 13 },
  legend: { gap: 6, marginTop: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { flex: 1, fontSize: 14 },
  legendValue: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  selection: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
