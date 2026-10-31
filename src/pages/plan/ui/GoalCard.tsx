import { router } from 'expo-router';

import { goalProgress } from '@/features/coupon-goal';

import { type CouponGoal, type Wallet } from '@/entities/portfolio';

import { formatMoney, plural } from '@/shared/lib';
import { InfoRow, LinkRow, Section } from '@/shared/ui';

type Props = {
  wallet: Wallet;
  goal: CouponGoal;
};

/** The plan's saved «Ціль: купони на місяць»: how the plan stands against it, and a way back to it. */
export function GoalCard({ wallet, goal }: Props) {
  const { currency, year, monthly } = goal;
  const { monthsOnGoal, plannedCount, plannedAmount, monthlyTopUp, topUpMonths } = goalProgress(
    wallet,
    goal,
  );
  const openGoal = () => router.push('/plan/goal');

  return (
    <Section
      title="Ціль: купони на місяць"
      footer="Власні кошти рахуються із запланованих купівель, тож змінюються, щойно ви підтверджуєте купівлі справжніми сумами."
    >
      <InfoRow
        label="Купони на місяць"
        hint={`У кожному місяці ${year} року`}
        value={formatMoney(monthly, currency)}
      />
      <InfoRow
        label="Місяців з ціллю"
        hint="Скільки місяців року купонів план уже закриває"
        value={`${monthsOnGoal} з 12`}
      />
      {plannedCount > 0 && (
        <InfoRow
          label={`Купівлі у ${year - 1} році`}
          hint="Заплановані купівлі, що ще попереду"
          value={`${plannedCount} · ${formatMoney(plannedAmount, currency)}`}
        />
      )}
      {topUpMonths > 0 && (
        <InfoRow
          label="Власні кошти на місяць"
          hint={`На початку кожного з ${topUpMonths} ${plural(topUpMonths, 'місяця', 'місяців', 'місяців')}, понад кошти плану`}
          value={formatMoney(monthlyTopUp, currency)}
        />
      )}
      <LinkRow title="Перерахувати ціль" onPress={openGoal} />
    </Section>
  );
}
