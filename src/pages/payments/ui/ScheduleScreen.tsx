import { StyleSheet, View } from 'react-native';

import { Card, EmptyState, LegendRow, MonthChart, SegmentedSelect, Typography } from '@/shared/ui';
import { MONTHS, formatMoney, round2 } from '@/shared/lib';
import { usePaymentSchedule } from '../model/usePaymentSchedule.hook';
import { PaymentSectionList } from './PaymentSectionList';
import { ScheduleHeader } from './ScheduleHeader';
import { useColors } from '@/shared/theme';

export default function ScheduleScreen() {
  const colors = useColors();
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

  return (
    <View style={styles.screen}>
      <ScheduleHeader year={year} min={firstYear} max={lastYear} onChange={setChosenYear} />
      {!bonds && holdings.length > 0 ? (
        <EmptyState loading />
      ) : payments.length === 0 ? (
        <EmptyState
          message={
            holdings.length === 0
              ? 'Додайте ОВДП в гаманець, і тут з’явиться графік виплат.'
              : 'Для ваших ОВДП немає виплат після дати купівлі.'
          }
        />
      ) : (
        <PaymentSectionList
          sections={sections}
          ListHeaderComponent={
            <View style={styles.header}>
              {currencies.length > 1 && (
                <SegmentedSelect
                  options={currencies.map((value) => ({ label: value, value }))}
                  value={currency}
                  onChange={setChosenCurrency}
                />
              )}

              {yearPayments.length > 0 && (
                <Card>
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
                </Card>
              )}
            </View>
          }
          emptyMessage={`У ${year} році виплат немає.`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: 24 },
  legend: { gap: 6, marginTop: 12 },
  selection: { marginTop: 8 },
});
