import { router } from 'expo-router';
import { Fragment } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  LegendRow,
  MonthChart,
  Button,
  InfoRow,
  Section,
  Separator,
  screenContent,
  YearNav,
} from '@/shared/ui';
import { FORECAST_CURRENCY, type PlannedPurchase } from '@/features/forecast';
import { MONTHS, formatDate, formatMoney, plural } from '@/shared/lib';
import { useForecastResults } from '../model/useForecastResults.hook';
import { useColors, themeStyles } from '@/shared/theme';

const uah = (value: number) => formatMoney(value, FORECAST_CURRENCY);
export default function ForecastScreen() {
  const colors = useColors();
  const theme = themeStyles;
  const {
    holdings,
    bonds,
    currentYear,
    lastYear,
    year,
    setChosenYear,
    summary,
    hasForeignBonds,
    walletTotal,
    planTotal,
    yearTotal,
    monthTotal,
    selectedMonth,
    setChosenMonth,
    topUpMonths,
  } = useForecastResults();

  if (!bonds && holdings.length > 0) {
    return (
      <View style={[styles.center, theme.background]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <YearNav year={year} min={currentYear} max={lastYear} onChange={setChosenYear} />
      <Button
        title="Налаштувати план"
        variant="secondary"
        onPress={() => router.push('/forecast/settings')}
      />

      <View style={[styles.card, theme.card]}>
        <Text style={[styles.cardLabel, theme.secondaryText]}>Дохід за {year} рік · прогноз</Text>
        <Text style={[styles.total, theme.text]}>{uah(yearTotal)}</Text>
        {planTotal > 0 && (
          <Text style={[styles.cardNote, theme.positiveText]}>+{uah(planTotal)} завдяки плану</Text>
        )}
        {summary.paidIncome > 0 && (
          <Text style={[styles.cardNote, theme.secondaryText]}>
            З них уже отримано {uah(summary.paidIncome)}
          </Text>
        )}

        <View style={styles.legend}>
          <LegendRow
            color={colors.seriesCoupon}
            label="Купони ОВДП з гаманця"
            value={uah(walletTotal)}
          />
          <LegendRow
            color={colors.seriesPlan}
            label="Дохід нових коротких ОВДП"
            value={uah(planTotal)}
          />
        </View>

        <MonthChart
          series={[
            { label: 'купони', color: colors.seriesCoupon, values: summary.walletIncome },
            { label: 'нові ОВДП', color: colors.seriesPlan, values: summary.planIncome },
          ]}
          currency={FORECAST_CURRENCY}
          selected={selectedMonth}
          onSelect={(month) => setChosenMonth({ year, month })}
        />

        <Text style={[styles.selection, theme.text]}>
          {MONTHS[selectedMonth]}:{' '}
          {monthTotal(selectedMonth) === 0
            ? 'доходу немає'
            : [
                summary.walletIncome[selectedMonth] > 0 &&
                  `купони ${uah(summary.walletIncome[selectedMonth])}`,
                summary.planIncome[selectedMonth] > 0 &&
                  `нові ОВДП ${uah(summary.planIncome[selectedMonth])}`,
              ]
                .filter(Boolean)
                .join(' + ')}
        </Text>
      </View>

      <Section
        title={`Гроші у ${year} році`}
        footer={hasForeignBonds ? 'Валютні ОВДП у прогноз не входять.' : undefined}
      >
        <InfoRow
          label={
            topUpMonths > 0
              ? `Поповнення, ${topUpMonths} ${plural(topUpMonths, 'місяць', 'місяці', 'місяців')}`
              : 'Поповнення'
          }
          value={uah(summary.contributions)}
        />
        <Separator />
        <InfoRow label="Реінвестовано" value={uah(summary.reinvested)} />
        <Separator />
        <InfoRow label="Дохід на руки" value={uah(summary.cashOut.income)} />
        {summary.cashOut.nominal > 0 && (
          <>
            <Separator />
            <InfoRow label="Повернений номінал на руки" value={uah(summary.cashOut.nominal)} />
          </>
        )}
        <Separator />
        <InfoRow label={`В ОВДП на 31.12.${year}`} value={uah(summary.nominalAtYearEnd)} />
      </Section>

      {summary.purchases.length > 0 && (
        <Section title={`Покупки у ${year} році`}>
          {summary.purchases.map((purchase, index) => (
            <Fragment key={purchase.date}>
              {index > 0 && <Separator />}
              <PurchaseRow purchase={purchase} />
            </Fragment>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function PurchaseRow({ purchase }: { purchase: PlannedPurchase }) {
  const theme = themeStyles;
  const sources = [
    purchase.contribution > 0 && `поповнення ${uah(purchase.contribution)}`,
    purchase.reinvested > 0 && `реінвест ${uah(purchase.reinvested)}`,
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <View style={styles.purchase}>
      <View style={styles.purchaseLeft}>
        <Text style={[styles.purchaseMonth, theme.text]}>
          {MONTHS[Number(purchase.date.slice(5, 7)) - 1]}
        </Text>
        <Text style={[styles.caption, theme.secondaryText]}>
          {sources} · погашення {formatDate(purchase.maturityDate)}
        </Text>
      </View>
      <View style={styles.purchaseRight}>
        <Text style={[styles.purchaseAmount, theme.text]}>{uah(purchase.amount)}</Text>
        <Text style={[styles.caption, theme.positiveText]}>+{uah(purchase.income)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  cardLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  total: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cardNote: { fontSize: 13 },
  legend: { gap: 6, marginTop: 12 },
  selection: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  purchaseLeft: { flex: 1, gap: 2 },
  purchaseMonth: { fontSize: 16, fontWeight: '500' },
  purchaseRight: { alignItems: 'flex-end', gap: 2 },
  purchaseAmount: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 13 },
});
