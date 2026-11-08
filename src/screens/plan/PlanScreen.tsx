import { RefreshControl, View } from 'react-native';

import { Stack, router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { FAB_CLEARANCE, FloatingActionButton } from '@/components/button/FloatingActionButton';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { ActionRow } from '@/components/layout/ActionRow';
import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { BondsUnavailableCard } from '@/components/portfolio/BondsUnavailableCard';
import { NbuSourceNote } from '@/components/portfolio/NbuSourceNote';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { Money } from '@/components/typography/Money';
import { Percent } from '@/components/typography/Percent';
import { Typography } from '@/components/typography/Typography';
import { useOptionChoice } from '@/hooks/useOptionChoice.hook';
import { usePullToRefresh } from '@/hooks/usePullToRefresh.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { goalMonthIndex } from '@/lib/coupon-goal/goalSpans';
import { netIncomeBasis, resultsByCurrency } from '@/lib/portfolio/position';
import { removeCouponGoalFromActivePlan } from '@/stores/plans';
import { confirmDestructive } from '@/utils/confirm';
import { formatMoney } from '@/utils/format';

import { upcomingPurchases } from './upcomingPurchases';
import { UpcomingPurchasesSection } from './UpcomingPurchasesSection';

/**
 * The plans tab: the active plan as a whole. First what to do next — the operations until the end of
 * next month, then its operations (bought or planned) added up to what the plan costs and earns
 * over its whole term.
 */
export default function PlanScreen() {
  const wallet = useWallet();
  const { plan, refresh, positions, operations } = wallet;
  const upcoming = upcomingPurchases(wallet);
  const numberOfPurchases = operations.length;
  const pullToRefresh = usePullToRefresh(refresh);
  const totals = resultsByCurrency(positions);
  // Totals come in CURRENCIES order.
  const currencies = totals.map((total) => total.currency);
  const [currency, setCurrency] = useOptionChoice(currencies);
  const total = totals.find((item) => item.currency === currency);

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;
  const goal = plan.goal;
  const goalIncomplete =
    goal &&
    positions.some(
      (position) => position.currency === goal.currency && !position.results?.complete,
    );
  const goalCoupons = goal ? Array.from({ length: goal.incomeYears * 12 }, () => 0) : [];
  if (goal) {
    for (const payment of wallet.payments) {
      const index = goalMonthIndex(goal, payment.date);
      if (payment.type === 'coupon' && payment.currency === goal.currency && index >= 0)
        goalCoupons[index] += payment.total;
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: plan.name }} />
      <View style={styles.screen}>
        <ScreenScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl {...pullToRefresh} />}
        >
          <StaleBondsNotice />
          {goal && (
            <Section
              title="Ціль: купони на місяць"
              footer="Ціль допомагає оцінити майбутні купони та орієнтовні купівлі."
            >
              <InfoRow
                label="Ціль за купонами"
                value={`${formatMoney(goal.monthly, goal.currency)} / місяць`}
              />
              <InfoRow
                label="Роки купонів"
                value={
                  goal.incomeYears === 1
                    ? String(goal.year)
                    : `${goal.year}–${goal.year + goal.incomeYears - 1}`
                }
              />
              <InfoRow
                label="Місяців з ціллю"
                value={
                  goalIncomplete
                    ? 'Неповні дані'
                    : `${goalCoupons.filter((amount) => amount >= goal.monthly).length} з ${goalCoupons.length}`
                }
              />
              <ActionRow
                title="Прибрати ціль"
                tone="danger"
                onPress={() =>
                  confirmDestructive(
                    'Прибрати ціль?',
                    'Усі купівлі залишаться в плані.',
                    'Прибрати',
                    removeCouponGoalFromActivePlan,
                  )
                }
              />
            </Section>
          )}
          <Typography variant="subhead" tone="secondary" style={styles.intro}>
            Підсумок плану за всіма його купівлями й продажами. Виплати рахуються за збереженим
            графіком НБУ.
          </Typography>

          {numberOfPurchases === 0 && (
            <EmptyState
              layout="inline"
              icon="bar-chart-outline"
              title="План порожній"
              message="У плані ще немає купівель, тож підсумовувати нічого. Додайте облігацію у гаманці: дату купівлі, кількість і суму — купівля з’явиться в гаманці та у виплатах."
            />
          )}
          {upcoming.map((item) => (
            <UpcomingPurchasesSection
              key={item.currency}
              upcoming={item}
              showCurrency={upcoming.length > 1}
              paymentsKnown={wallet.positions.every(
                (position) => position.currency !== item.currency || !!position.results?.complete,
              )}
            />
          ))}

          {/* The totals need the NBU data; without it this stands in their place. */}
          {numberOfPurchases > 0 && positions.every((position) => !position.bond) && (
            <BondsUnavailableCard />
          )}

          {total && (
            <>
              {currencies.length > 1 && (
                <SegmentedSelect
                  options={currencies.map((item) => ({ label: item, value: item }))}
                  value={total.currency}
                  onChange={setCurrency}
                />
              )}
              <Section
                title={`Вкладення · ${total.currency}`}
                footer={
                  total.withoutDataCount > 0
                    ? `Облігацій без даних НБУ: ${total.withoutDataCount}. Їхню вартість враховано, а виплати й дохід — ні.`
                    : undefined
                }
              >
                <InfoRow
                  label="Вкладено"
                  hint="Скільки коштують усі купівлі плану"
                  value={<Money value={total.invested} currency={total.currency} />}
                />
              </Section>
              <Section
                title="Надходження"
                footer={
                  total.incompleteCount > 0
                    ? `НБУ ще не опублікував погашення для ${total.incompleteCount} облігацій, тож у погашенні й усього надходжень їх немає.`
                    : undefined
                }
              >
                <InfoRow
                  label="Погашення"
                  hint="У дату погашення держава повертає номінал, а не ціну купівлі. Якщо ви заплатили більше за номінал, погашення буде менше за вкладене — цю різницю покривають купони"
                  value={<Money value={total.redemption} currency={total.currency} />}
                />
                <InfoRow
                  label="Купони"
                  hint="Відсотки, отримані й ще очікувані до погашення"
                  value={<Money value={total.coupons} currency={total.currency} />}
                />
                <InfoRow
                  label="Продажі"
                  value={<Money value={total.saleProceeds} currency={total.currency} />}
                />
                <InfoRow
                  label="Усього надходжень"
                  hint="Купони, погашення та суми продажів"
                  value={<Money value={total.totalPayments} currency={total.currency} />}
                />
              </Section>
              {total.netIncome !== null && (
                <Section
                  title="Результат"
                  footer={
                    total.incompleteCount > 0 || total.withoutDataCount > 0
                      ? `Облігації без даних або опублікованого погашення (${total.incompleteCount + total.withoutDataCount}) у чистий дохід і дохідність за весь строк не враховано.`
                      : undefined
                  }
                >
                  <InfoRow
                    label="Чистий дохід"
                    hint={netIncomeBasis(total) ?? 'Виплати мінус вкладення — ваш заробіток'}
                    value={<Money value={total.netIncome} currency={total.currency} />}
                    signedValue={total.netIncome}
                  />
                  <InfoRow
                    label="Дохідність за весь строк"
                    hint={
                      total.incompleteCount > 0 || total.withoutDataCount > 0
                        ? `Чистий дохід поділено на вкладення лише в облігації з опублікованим погашенням: ${formatMoney(total.published.invested, total.currency)}.`
                        : 'Чистий дохід у відсотках від вкладень за весь строк, без перерахунку на рік; комісії враховані в сумах операцій'
                    }
                    value={<Percent value={total.returnPercent} />}
                  />
                  {total.annualYield !== null && (
                    <InfoRow
                      label="Річна дохідність"
                      hint={`Ціна купівлі й виплати до погашення, перераховані на рік; середня зважена на суму купівель.${total.withoutYieldCount ? ` Не враховано облігації без розрахованої дохідності: ${total.withoutYieldCount}.` : ''}`}
                      value={<Percent value={total.annualYield} />}
                    />
                  )}
                </Section>
              )}
            </>
          )}
          <NbuSourceNote />
        </ScreenScrollView>
        <FloatingActionButton
          icon="flag-outline"
          accessibilityLabel={goal ? 'Перерахувати ціль' : 'Створити ціль за купонами'}
          onPress={() => router.push('/plan/goal')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  content: { gap: theme.space.xl, paddingBottom: FAB_CLEARANCE },
  intro: { marginHorizontal: theme.space.lg },
}));
