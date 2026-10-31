import { router } from 'expo-router';

import { goalProgress } from '@/features/coupon-goal';

import { type CouponGoal, type Wallet, goalLastYear } from '@/entities/portfolio';

import { formatMoney, plural } from '@/shared/lib';
import { InfoRow, LinkRow, Section } from '@/shared/ui';

import { inYears, ofYears, spanYears } from './goalTexts';

type Props = {
  wallet: Wallet;
  goal: CouponGoal;
};

/** The plan's saved «Ціль: купони на місяць»: how the plan stands against it, and a way back to it. */
export function GoalCard({ wallet, goal }: Props) {
  const { currency, monthly, reinvest } = goal;
  const progress = goalProgress(wallet, goal);
  const { monthsOnGoal, goalMonths, plannedCount, plannedAmount, monthlyTopUp, topUpMonths } =
    progress;
  const openGoal = () => router.push('/plan/goal');
  const months = `${topUpMonths} ${plural(topUpMonths, 'місяця', 'місяців', 'місяців')}`;

  return (
    <Section
      title="Ціль: купони на місяць"
      footer="Власні кошти рахуються із запланованих купівель, тож змінюються, щойно ви підтверджуєте купівлі справжніми сумами."
    >
      <InfoRow
        label="Купони на місяць"
        hint={`У кожному місяці ${ofYears(goal.year, goalLastYear(goal))}`}
        value={formatMoney(monthly, currency)}
      />
      <InfoRow
        label="Місяців з ціллю"
        hint="Скільки місяців років купонів план уже закриває"
        value={`${monthsOnGoal} з ${goalMonths}`}
      />
      {plannedCount > 0 && (
        <InfoRow
          label={`Купівлі ${inYears(...spanYears(progress))}`}
          hint="Заплановані купівлі, що ще попереду"
          value={`${plannedCount} · ${formatMoney(plannedAmount, currency)}`}
        />
      )}
      {topUpMonths > 0 && (
        <InfoRow
          label="Власні кошти на місяць"
          hint={
            reinvest
              ? `На початку кожного з ${months}, понад виплати плану`
              : `На початку кожного з ${months}; виплати плану ви забираєте`
          }
          value={formatMoney(monthlyTopUp, currency)}
        />
      )}
      <LinkRow title="Перерахувати ціль" onPress={openGoal} />
    </Section>
  );
}
