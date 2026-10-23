import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  CURRENCIES,
  NbuSourceNote,
  StaleBondsNotice,
  planTotals,
  removeInvestmentPlan,
  useWallet,
  type Currency,
} from '@/entities/portfolio';
import { confirmDestructive, formatMoney, plural, usePullToRefresh } from '@/shared/lib';
import {
  ActionRow,
  Card,
  InfoRow,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Separator,
  Typography,
} from '@/shared/ui';

/**
 * The plans tab: the active plan as a whole. Its purchases (bought or planned) are the ones in the
 * wallet; here they add up to what the plan costs and earns over its whole term.
 */
export default function PlanScreen() {
  const { plan, bonds, error, refresh, positions, payments, purchaseEvents, numberOfPurchases } =
    useWallet();
  const pullToRefresh = usePullToRefresh(refresh);
  const planId = plan?.id ?? '';
  const totals = planTotals(positions, payments, purchaseEvents);
  const unknownBonds = positions.filter((item) => !item.bond).length;
  const [chosenCurrency, setCurrency] = useState<Currency | null>(null);
  const currencies = totals.map((total) => total.currency);
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];
  const total = totals.find((item) => item.currency === currency);

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;

  const renamePlan = () => router.push({ pathname: '/plan/name', params: { planId } });

  const confirmRemovePlan = () =>
    confirmDestructive(
      'Видалити план?',
      numberOfPurchases
        ? `План «${plan.name}» і ${numberOfPurchases} ${plural(numberOfPurchases, 'купівлю', 'купівлі', 'купівель')} в ньому буде видалено.`
        : `План «${plan.name}» буде видалено.`,
      'Видалити',
      () => removeInvestmentPlan(planId),
    );

  return (
    <>
      {/* `headerTitle`, not `title`: the tab keeps its own label. */}
      <Stack.Screen options={{ headerTitle: plan.name }} />
      <ScreenScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl {...pullToRefresh} />}
      >
        <StaleBondsNotice error={error} />
        <Typography variant="subhead" tone="secondary" style={styles.intro}>
          Підсумок плану за всіма його купівлями — зробленими й запланованими. Виплати рахуються за
          графіком НБУ.
        </Typography>

        {numberOfPurchases === 0 && (
          <Card>
            <Typography variant="headline">План порожній</Typography>
            <Typography variant="subhead" tone="secondary">
              Додайте ОВДП у гаманці: дату купівлі, кількість і суму. Купівля з’явиться в гаманці та
              у виплатах.
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
                onChange={setCurrency}
              />
            )}
            <Section title={`Вкладення · ${total.currency}`}>
              <InfoRow
                label="Вкладено"
                hint="Скільки коштують усі купівлі плану"
                value={formatMoney(total.invested, total.currency)}
              />
            </Section>
            <Section title="Виплати">
              <InfoRow
                label="Погашення"
                hint="Номінал, який повернуть у дату погашення. Зазвичай він менший за ціну купівлі — різницю покривають купони"
                value={
                  total.complete
                    ? formatMoney(total.redemption, total.currency)
                    : 'Немає повних даних НБУ'
                }
              />
              <Separator />
              <InfoRow
                label="Купони"
                hint="Відсотки, отримані й ще очікувані до погашення"
                value={formatMoney(total.coupons, total.currency)}
              />
              {total.complete && (
                <>
                  <Separator />
                  <InfoRow
                    label="Усього виплат"
                    hint="Погашення разом із купонами"
                    value={formatMoney(total.totalPayments, total.currency)}
                  />
                </>
              )}
            </Section>
            {total.complete && (
              <Section title="Результат">
                <InfoRow
                  label="Чистий дохід"
                  hint="Виплати мінус вкладення — ваш заробіток"
                  value={formatMoney(total.netIncome, total.currency)}
                />
                <Separator />
                <InfoRow
                  label="Дохідність"
                  hint="Чистий дохід у відсотках від вкладень за весь строк, без перерахунку на рік, податків і комісій"
                  value={`${total.returnPercent}%`}
                />
              </Section>
            )}
          </>
        )}
        {unknownBonds > 0 && (
          <Typography variant="caption1" tone="secondary" style={styles.intro}>
            {unknownBonds} ОВДП немає в даних НБУ, тому їх не враховано в підсумку.
          </Typography>
        )}
        <Section title="Керування планом">
          <ActionRow title="Перейменувати план" onPress={renamePlan} />
          <Separator />
          <ActionRow title="Видалити план" tone="danger" onPress={confirmRemovePlan} />
        </Section>
        <NbuSourceNote />
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space.xl },
  intro: { marginHorizontal: theme.space.lg },
}));
