import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  CURRENCIES,
  NbuSourceNote,
  StaleBondsNotice,
  plannedAmount,
  projectPlan,
  removeInvestmentPlan,
  useBonds,
  useActivePlan,
  usePurchases,
  type Currency,
  type ScheduleEvent,
} from '@/entities/portfolio';
import {
  MONTHS,
  confirmDestructive,
  formatDate,
  formatMoney,
  plural,
  round2,
  todayISO,
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

/** The plans tab: the active plan's planned purchases and their forecast. */
export default function PlanScreen() {
  const plan = useActivePlan();
  const planId = plan?.id ?? '';
  const planned = plan?.items ?? [];
  const ownedCount = usePurchases().filter((purchase) => purchase.planId === planId).length;
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = todayISO();
  const projection = projectPlan(planned, byIsin, today);
  const [chosenCurrency, setCurrency] = useState<Currency | null>(null);
  const [chosenYear, setYear] = useState<number | null>(null);
  const [selectedMonth, setMonth] = useState<number | null>(null);
  const currencies = projection.totals.map((total) => total.currency);
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];
  const total = projection.totals.find((item) => item.currency === currency);
  const events = [...projection.investments, ...projection.payments]
    .filter((event) => event.currency === currency)
    .sort(eventOrder);
  const currentYear = Number(today.slice(0, 4));
  const years = events.map((event) => Number(event.date.slice(0, 4)));
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;
  const year =
    chosenYear && chosenYear >= firstYear && chosenYear <= lastYear ? chosenYear : firstYear;
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
  const sortedPlanned = [...planned].sort((a, b) => a.date.localeCompare(b.date));

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;

  return (
    <View style={styles.screen}>
      {/* `headerTitle`, not `title`: the tab keeps its own label. */}
      <Stack.Screen options={{ headerTitle: plan.name }} />
      <ScreenScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
      >
        <StaleBondsNotice error={error} />
        <Typography variant="subhead" tone="secondary" style={styles.intro}>
          Заплануйте, коли й скільки ОВДП купити. Розрахунок виплат базується на графіку НБУ та
          вашій орієнтовній ціні.
        </Typography>

        {sortedPlanned.length === 0 ? (
          <Card>
            <Typography variant="headline">План порожній</Typography>
            <Typography variant="subhead" tone="secondary">
              Додайте ОВДП, дату купівлі, кількість і ціну однієї облігації.
            </Typography>
          </Card>
        ) : (
          <Section title="Заплановані покупки">
            {sortedPlanned.map((item, index) => {
              const bond = byIsin.get(item.isin);
              const isExcluded =
                item.date < today ||
                !bond ||
                item.date < bond.issueDate ||
                item.date >= bond.maturityDate;
              return (
                <View key={item.id}>
                  {index > 0 && <Separator />}
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/plan/edit/[id]', params: { id: item.id, planId } })
                    }
                    accessibilityRole="link"
                    accessibilityLabel={`Змінити план ${item.isin} від ${formatDate(item.date)}`}
                    style={({ pressed }) => [styles.purchase, pressed && styles.pressed]}
                  >
                    <View style={styles.purchaseText}>
                      <Typography variant="callout" weight="semibold" tabular>
                        {item.isin}
                      </Typography>
                      <Typography variant="caption1" tone="secondary">
                        {formatDate(item.date)} · {item.quantity} шт · ціна{' '}
                        {formatMoney(item.pricePerBond, item.currency)}
                      </Typography>
                      {isExcluded && (
                        <Typography variant="caption1" tone="danger">
                          {item.date < today
                            ? 'Дата минула — змініть план'
                            : 'Немає чинних даних для розрахунку'}
                        </Typography>
                      )}
                    </View>
                    <Typography variant="callout" weight="semibold" tabular>
                      {formatMoney(plannedAmount(item), item.currency)}
                    </Typography>
                  </Pressable>
                </View>
              );
            })}
          </Section>
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
              <InfoRow label="Вкладете" value={formatMoney(total.invested, total.currency)} />
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
                  <PlanEventRow event={event} />
                </View>
              ))}
            </Section>
          </>
        )}
        {projection.excluded > 0 && (
          <Typography variant="caption1" tone="secondary" style={styles.intro}>
            {projection.excluded} запланованих покупок не включено до прогнозу. Відкрийте їх, щоб
            змінити дату або перевірити ОВДП.
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
                ownedCount
                  ? `План «${plan.name}», його заплановані покупки та ${ownedCount} ${plural(ownedCount, 'покупку', 'покупки', 'покупок')} у гаманці буде видалено.`
                  : `План «${plan.name}» і всі його заплановані покупки буде видалено.`,
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
        accessibilityLabel="Додати покупку до плану"
        onPress={() => router.push({ pathname: '/add', params: { planId } })}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  content: { gap: theme.space.xl, paddingBottom: FAB_CLEARANCE },
  intro: { marginHorizontal: theme.space.lg },
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  purchaseText: { flex: 1, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
  chartSection: { gap: theme.space.md },
  monthDetails: { gap: theme.space.sm, marginTop: theme.space.md },
}));
