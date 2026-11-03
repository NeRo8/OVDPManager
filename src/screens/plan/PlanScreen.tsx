import { RefreshControl } from 'react-native';

import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { SegmentedSelect } from '@/components/form/SegmentedSelect';
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
import { netIncomeBasis, resultsByCurrency } from '@/lib/portfolio/position';
import { formatMoney } from '@/utils/format';

import { upcomingPurchases } from './upcomingPurchases';
import { UpcomingPurchasesSection } from './UpcomingPurchasesSection';

/**
 * The plans tab: the active plan as a whole. First what to do next — the purchases until the end of
 * next month, then its purchases (bought or planned) added up to what the plan costs and earns
 * over its whole term.
 */
export default function PlanScreen() {
  const wallet = useWallet();
  const { plan, bonds, refresh, positions, purchases } = wallet;
  const upcoming = upcomingPurchases(wallet);
  const numberOfPurchases = purchases.length;
  const pullToRefresh = usePullToRefresh(refresh);
  const totals = resultsByCurrency(positions);
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
            paymentsKnown={
              !!bonds &&
              wallet.positions.every(
                (position) => position.currency !== item.currency || !!position.results?.complete,
              )
            }
          />
        ))}

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
            <Section
              title={`Вкладення · ${total.currency}`}
              footer={
                total.withoutDataCount > 0
                  ? `${total.withoutDataCount} ОВДП немає в даних НБУ: що вони коштували, тут враховано, а їхні виплати й дохід — ні.`
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
                value={<Money value={total.redemption} currency={total.currency} />}
              />
              <InfoRow
                label="Купони"
                hint="Відсотки, отримані й ще очікувані до погашення"
                value={<Money value={total.coupons} currency={total.currency} />}
              />
              <InfoRow
                label="Усього виплат"
                hint="Погашення разом із купонами"
                value={<Money value={total.totalPayments} currency={total.currency} />}
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
                  hint={netIncomeBasis(total) ?? 'Виплати мінус вкладення — ваш заробіток'}
                  value={<Money value={total.netIncome} currency={total.currency} />}
                  signedValue={total.netIncome}
                />
                <InfoRow
                  label="Дохідність за весь строк"
                  hint={
                    total.incompleteCount > 0
                      ? `Чистий дохід поділено на вкладення лише в ОВДП з опублікованим погашенням: ${formatMoney(total.published.invested, total.currency)}.`
                      : 'Чистий дохід у відсотках від вкладень за весь строк, без перерахунку на рік, податків і комісій'
                  }
                  value={<Percent value={total.returnPercent} />}
                />
                {total.annualYield !== null && (
                  <InfoRow
                    label="Річна дохідність"
                    hint={`Ціна купівлі й виплати до погашення, перераховані на рік; середня зважена на суму купівель.${total.withoutYieldCount ? ` Не враховано ОВДП без розрахованої дохідності: ${total.withoutYieldCount}.` : ''}`}
                    value={<Percent value={total.annualYield} />}
                  />
                )}
              </Section>
            )}
          </>
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
