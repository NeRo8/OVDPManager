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
          Підсумок плану за всіма його покупками — купленими й запланованими. Виплати рахуються за
          графіком НБУ.
        </Typography>

        {numberOfPurchases === 0 && (
          <Card>
            <Typography variant="headline">План порожній</Typography>
            <Typography variant="subhead" tone="secondary">
              Додайте ОВДП у гаманці: дату купівлі, кількість і суму покупки. Покупка з’явиться в
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
                onChange={setCurrency}
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
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space.xl },
  intro: { marginHorizontal: theme.space.lg },
}));
