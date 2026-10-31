import { RefreshControl } from 'react-native';

import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  BondsUnavailableCard,
  NbuSourceNote,
  StaleBondsNotice,
  resultsByCurrency,
  useWallet,
} from '@/entities/portfolio';

import { formatMoney, useOptionChoice, usePullToRefresh } from '@/shared/lib';
import {
  EmptyState,
  InfoRow,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Typography,
} from '@/shared/ui';

import { upcomingPurchases } from '../model/upcomingPurchases';

import { GoalCard } from './GoalCard';
import { UpcomingPurchasesSection } from './UpcomingPurchasesSection';

/**
 * The plans tab: the active plan as a whole. First what to do next — the purchases until the end of
 * next month and the plan's goal — then its purchases (bought or planned) added up to what the plan
 * costs and earns over its whole term.
 */
export default function PlanScreen() {
  const wallet = useWallet();
  const { plan, bonds, refresh, positions, purchases } = wallet;
  const upcoming = upcomingPurchases(wallet);
  const numberOfPurchases = purchases.length;
  const pullToRefresh = usePullToRefresh(refresh);
  const totals = resultsByCurrency(positions);
  const unknownBonds = positions.filter((item) => !item.bond).length;
  // Totals come in CURRENCIES order.
  const currencies = totals.map((total) => total.currency);
  const [currency, setCurrency] = useOptionChoice(currencies);
  const total = totals.find((item) => item.currency === currency);

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;

  return (
    <>
      <Stack.Screen options={{ title: plan.name }} />
      <ScreenScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl {...pullToRefresh} />}
      >
        <StaleBondsNotice />
        <Typography variant="subhead" tone="secondary" style={styles.intro}>
          Підсумок плану за всіма його купівлями — зробленими й запланованими. Виплати рахуються за
          графіком НБУ.
        </Typography>

        {numberOfPurchases === 0 && (
          <EmptyState
            layout="inline"
            icon="bar-chart-outline"
            title="План порожній"
            message="У плані ще немає купівель, тож підсумовувати нічого. Додайте ОВДП у гаманці: дату купівлі, кількість і суму — купівля з’явиться в гаманці та у виплатах."
          />
        )}
        {upcoming.map((item) => (
          <UpcomingPurchasesSection
            key={item.currency}
            upcoming={item}
            showCurrency={upcoming.length > 1}
          />
        ))}
        {plan.goal && <GoalCard wallet={wallet} goal={plan.goal} />}

        {/* The totals need the NBU data; without it this stands in their place. */}
        {numberOfPurchases > 0 && <BondsUnavailableCard />}

        {bonds && total && (
          <>
            {currencies.length > 1 && (
              <SegmentedSelect
                options={currencies.map((item) => ({ label: item, value: item }))}
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
            <Section
              title="Виплати"
              footer={
                total.incompleteCount > 0
                  ? `НБУ ще не опублікував погашення ${total.incompleteCount} ОВДП, тож у погашенні й усього виплат їх немає.`
                  : undefined
              }
            >
              <InfoRow
                label="Погашення"
                hint="У дату погашення держава повертає номінал, а не ціну купівлі. Якщо ви заплатили більше за номінал, погашення буде менше за вкладене — цю різницю покривають купони"
                value={formatMoney(total.redemption, total.currency)}
              />
              <InfoRow
                label="Купони"
                hint="Відсотки, отримані й ще очікувані до погашення"
                value={formatMoney(total.coupons, total.currency)}
              />
              <InfoRow
                label="Усього виплат"
                hint="Погашення разом із купонами"
                value={formatMoney(total.totalPayments, total.currency)}
              />
            </Section>
            {total.netIncome !== null && (
              <Section
                title="Результат"
                footer={
                  total.incompleteCount > 0
                    ? `ОВДП без опублікованого погашення (${total.incompleteCount}) у чистий дохід і дохідність за весь строк не враховано.`
                    : undefined
                }
              >
                <InfoRow
                  label="Чистий дохід"
                  hint="Виплати мінус вкладення — ваш заробіток"
                  value={formatMoney(total.netIncome, total.currency)}
                  signedValue={total.netIncome}
                />
                <InfoRow
                  label="Дохідність за весь строк"
                  hint="Чистий дохід у відсотках від вкладень за весь строк, без перерахунку на рік, податків і комісій"
                  value={total.returnPercent === null ? '—' : `${total.returnPercent}%`}
                />
                {total.annualYield !== null && (
                  <InfoRow
                    label="Річна дохідність"
                    hint="Ціна купівлі й кожна виплата до погашення, перераховані на рік, — середня за ОВДП плану, зважена на суму купівель. Її можна порівнювати з депозитом і обліковою ставкою"
                    value={`${total.annualYield}%`}
                  />
                )}
              </Section>
            )}
          </>
        )}
        {unknownBonds > 0 && (
          <Typography variant="caption1" tone="secondary" style={styles.intro}>
            {unknownBonds} ОВДП немає в даних НБУ, тому їх не враховано в підсумку.
          </Typography>
        )}
        <NbuSourceNote />
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space.xl },
  intro: { marginHorizontal: theme.space.lg },
}));
