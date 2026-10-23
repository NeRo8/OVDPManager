import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  CURRENCIES,
  NbuSourceNote,
  StaleBondsNotice,
  planTotals,
  removeInvestmentPlan,
  useWallet,
  type Currency,
  type ScheduleEvent,
} from '@/entities/portfolio';
import {
  MONTHS,
  confirmDestructive,
  formatMoney,
  plural,
  round2,
  usePullToRefresh,
} from '@/shared/lib';
import {
  ActionRow,
  Card,
  FAB_CLEARANCE,
  FloatingActionButton,
  InfoRow,
  LegendRow,
  MonthChart,
  ScreenScrollView,
  Section,
  SectionTitle,
  SegmentedSelect,
  Separator,
  Typography,
  YearNav,
  type ChartSeries,
} from '@/shared/ui';
import { PlanEventRow } from './PlanEventRow';

function eventOrder(a: ScheduleEvent, b: ScheduleEvent) {
  return (
    a.date.localeCompare(b.date) || Number(a.type === 'purchase') - Number(b.type === 'purchase')
  );
}

/**
 * The plans tab: the active plan as a whole. Its purchases (bought or planned) are the ones in the
 * wallet; here they add up to what the plan costs and earns over its whole term.
 */
export default function PlanScreen() {
  const {
    plan,
    bonds,
    error,
    refresh,
    today,
    positions,
    payments,
    purchaseEvents,
    numberOfPurchases,
  } = useWallet();
  const pullToRefresh = usePullToRefresh(refresh);
  const planId = plan?.id ?? '';
  const totals = planTotals(positions, payments, purchaseEvents);
  const unknownBonds = positions.filter((item) => !item.bond).length;
  const [chosenCurrency, setCurrency] = useState<Currency | null>(null);
  const [chosenYear, setYear] = useState<number | null>(null);
  const [selectedMonth, setMonth] = useState<number | null>(null);
  const currencies = totals.map((total) => total.currency);
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];
  const total = totals.find((item) => item.currency === currency);
  const events = [...purchaseEvents, ...payments]
    .filter((event) => event.currency === currency)
    .sort(eventOrder);
  const currentYear = Number(today.slice(0, 4));
  const years = events.map((event) => Number(event.date.slice(0, 4)));
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;
  // Open on this year when the plan spans it, so the chart starts at what is happening now.
  const defaultYear = Math.min(Math.max(currentYear, firstYear), lastYear);
  const year =
    chosenYear && chosenYear >= firstYear && chosenYear <= lastYear ? chosenYear : defaultYear;
  const yearEvents = events.filter((event) => Number(event.date.slice(0, 4)) === year);
  const monthly = (type: ScheduleEvent['type']) =>
    MONTHS.map((_, month) =>
      round2(
        yearEvents
          .filter((event) => event.type === type && Number(event.date.slice(5, 7)) === month + 1)
          .reduce((sum, event) => sum + event.total, 0),
      ),
    );
  const series: ChartSeries[] = [
    { label: 'купони', color: 'coupon', values: monthly('coupon') },
    { label: 'погашення', color: 'nominal', values: monthly('redemption') },
    { label: 'покупки', color: 'purchase', values: monthly('purchase'), direction: 'down' },
  ];
  const monthDetails =
    selectedMonth === null ? [] : series.filter((item) => item.values[selectedMonth] > 0);

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;

  return (
    <View style={styles.screen}>
      {/* `headerTitle`, not `title`: the tab keeps its own label. */}
      <Stack.Screen options={{ headerTitle: plan.name }} />
      <ScreenScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl {...pullToRefresh} />}
      >
        <StaleBondsNotice error={error} />
        <Typography variant="subhead" tone="secondary" style={styles.intro}>
          Підсумок плану за всіма його покупками — купленими й запланованими. Виплати рахуються за
          графіком НБУ.
        </Typography>

        {numberOfPurchases === 0 && (
          <Card>
            <Typography variant="headline">План порожній</Typography>
            <Typography variant="subhead" tone="secondary">
              Додайте ОВДП: дату купівлі, кількість і ціну однієї облігації. Покупка з’явиться в
              гаманці та у виплатах.
            </Typography>
          </Card>
        )}

        {bonds && total && (
          <>
            {currencies.length > 1 && (
              <SegmentedSelect
                options={CURRENCIES.filter((item) => currencies.includes(item)).map((item) => ({
                  label: item,
                  value: item,
                }))}
                value={total.currency}
                onChange={(value) => {
                  setCurrency(value);
                  setYear(null);
                  setMonth(null);
                }}
              />
            )}
            <Section
              title={`Увесь план · ${total.currency}`}
              footer="Дохідність — за весь строк плану, без річного перерахунку, податків і комісій."
            >
              <InfoRow label="Вкладення" value={formatMoney(total.invested, total.currency)} />
              <Separator />
              <InfoRow label="Купони" value={formatMoney(total.coupons, total.currency)} />
              <Separator />
              <InfoRow
                label="Погашення"
                value={
                  total.complete
                    ? formatMoney(total.redemption, total.currency)
                    : 'Немає повних даних НБУ'
                }
              />
              {total.complete && (
                <>
                  <Separator />
                  <InfoRow
                    label="Усі виплати"
                    value={formatMoney(total.proceeds, total.currency)}
                  />
                  <Separator />
                  <InfoRow
                    label="Чистий результат"
                    value={formatMoney(total.profit, total.currency)}
                  />
                  <Separator />
                  <InfoRow label="Дохідність" value={`${total.returnPercent}%`} />
                </>
              )}
            </Section>

            <View style={styles.chartSection}>
              <SectionTitle title="Графік виплат і покупок" />
              <YearNav
                year={year}
                min={firstYear}
                max={lastYear}
                onChange={(value) => {
                  setYear(value);
                  setMonth(null);
                }}
              />
              <Card>
                <MonthChart
                  series={series}
                  currency={total.currency}
                  selected={selectedMonth}
                  onSelect={setMonth}
                />
                {selectedMonth !== null && (
                  <View style={styles.monthDetails}>
                    <Separator />
                    <Typography variant="subhead" weight="semibold">
                      {MONTHS[selectedMonth]} {year}
                    </Typography>
                    {monthDetails.length ? (
                      monthDetails.map((item) => (
                        <LegendRow
                          key={item.label}
                          color={item.color}
                          label={item.label}
                          value={formatMoney(item.values[selectedMonth], total.currency)}
                        />
                      ))
                    ) : (
                      <Typography variant="footnote" tone="secondary">
                        Операцій немає
                      </Typography>
                    )}
                  </View>
                )}
              </Card>
            </View>

            <Section title={`Операції · ${year}`}>
              {yearEvents.map((event, index) => (
                <View key={`${event.type}-${event.isin}-${event.date}-${index}`}>
                  {index > 0 && <Separator />}
                  <PlanEventRow event={event} today={today} />
                </View>
              ))}
            </Section>
          </>
        )}
        {unknownBonds > 0 && (
          <Typography variant="caption1" tone="secondary" style={styles.intro}>
            {unknownBonds} ОВДП немає в даних НБУ, тому їх не враховано в підсумку.
          </Typography>
        )}
        <Section title="Керування планом">
          <ActionRow
            title="Перейменувати план"
            onPress={() => router.push({ pathname: '/plan/name', params: { planId } })}
          />
          <Separator />
          <ActionRow
            title="Видалити план"
            onPress={() =>
              confirmDestructive(
                'Видалити план?',
                numberOfPurchases
                  ? `План «${plan.name}» і ${numberOfPurchases} ${plural(numberOfPurchases, 'покупку', 'покупки', 'покупок')} в ньому буде видалено.`
                  : `План «${plan.name}» буде видалено.`,
                'Видалити',
                () => {
                  removeInvestmentPlan(planId);
                },
              )
            }
          />
        </Section>
        <NbuSourceNote />
      </ScreenScrollView>
      <FloatingActionButton
        accessibilityLabel="Додати ОВДП до плану"
        onPress={() => router.push('/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  content: { gap: theme.space.xl, paddingBottom: FAB_CLEARANCE },
  intro: { marginHorizontal: theme.space.lg },
  chartSection: { gap: theme.space.md },
  monthDetails: { gap: theme.space.sm, marginTop: theme.space.md },
}));
