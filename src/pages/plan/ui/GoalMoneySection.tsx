import { type CouponGoalPlan } from '@/features/coupon-goal';

import { type CouponGoal } from '@/entities/portfolio';

import { formatMoney, plural, round2 } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import { inYears, spanYears } from './goalTexts';

type Props = {
  plan: CouponGoalPlan;
  goal: CouponGoal;
};

/**
 * What the goal's purchases cost and where the money comes from: the payments of «Роки купівель»
 * first when they are reinvested, then money of one's own; without reinvesting, what is taken out.
 */
export function GoalMoneySection({ plan, goal }: Props) {
  const { cost, planMoney, goalMoney, monthlyTopUp, topUpMonths, leftover } = plan;
  const { currency, reinvest } = goal;
  const ownTotal = round2(monthlyTopUp * topUpMonths);
  const years = inYears(...spanYears(plan));
  const payouts = round2(planMoney + goalMoney);
  const months = `${topUpMonths} ${plural(topUpMonths, 'місяця', 'місяців', 'місяців')}`;

  return (
    <Section title="Гроші">
      <InfoRow
        label="Коштуватимуть купівлі"
        hint="За орієнтовною ціною кожної ОВДП на день купівлі"
        value={formatMoney(cost, currency)}
      />
      {reinvest && (
        <InfoRow
          label="Кошти плану"
          hint={`Купони й погашення плану ${years} — купівлі оплачуються спершу з них`}
          value={formatMoney(planMoney, currency)}
        />
      )}
      {reinvest && goalMoney > 0 && (
        <InfoRow
          label="Купони купівель під ціль"
          hint={`Купони ОВДП, куплених під ціль, ${years} — теж ідуть на наступні купівлі`}
          value={formatMoney(goalMoney, currency)}
        />
      )}
      <InfoRow
        label="Власні кошти на місяць"
        hint={
          monthlyTopUp > 0
            ? `На початку кожного з ${months}, разом ${formatMoney(ownTotal, currency)}`
            : 'Виплат у роки купівель вистачає на всі купівлі'
        }
        value={formatMoney(monthlyTopUp, currency)}
      />
      {!reinvest && payouts > 0 && (
        <InfoRow
          label="Виплати, які ви заберете"
          hint={`Купони й погашення ${years}, і плану, і купівель під ціль: на купівлі вони не йдуть`}
          value={formatMoney(payouts, currency)}
        />
      )}
      {leftover >= 1 && (
        <InfoRow
          label="Залишиться"
          hint={
            reinvest
              ? 'Виплати й власні кошти, яких не забрали купівлі цілих ОВДП'
              : 'Власні кошти, яких не забрали купівлі цілих ОВДП'
          }
          value={formatMoney(leftover, currency)}
        />
      )}
    </Section>
  );
}
