import { type CouponGoalPlan } from '@/features/coupon-goal';

import { type Currency } from '@/entities/portfolio';

import { formatMoney, plural, round2 } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

type Props = {
  plan: CouponGoalPlan;
  currency: Currency;
  /** The purchase year */
  year: number;
};

/** What the goal's purchases cost and where the money comes from. */
export function GoalMoneySection({ plan, currency, year }: Props) {
  const { cost, planMoney, monthlyTopUp, topUpMonths, leftover } = plan;
  const ownTotal = round2(monthlyTopUp * topUpMonths);

  return (
    <Section title="Гроші">
      <InfoRow
        label="Коштуватимуть купівлі"
        hint="За орієнтовною ціною кожної ОВДП на день купівлі"
        value={formatMoney(cost, currency)}
      />
      <InfoRow
        label="Кошти плану"
        hint={`Купони й погашення плану в ${year} році — купівлі оплачуються спершу з них`}
        value={formatMoney(planMoney, currency)}
      />
      <InfoRow
        label="Власні кошти на місяць"
        hint={
          monthlyTopUp > 0
            ? `На початку кожного з ${topUpMonths} ${plural(topUpMonths, 'місяця', 'місяців', 'місяців')}, разом ${formatMoney(ownTotal, currency)}`
            : 'Коштів плану вистачає на всі купівлі'
        }
        value={formatMoney(monthlyTopUp, currency)}
      />
      {leftover >= 1 && (
        <InfoRow
          label="Залишиться"
          hint="Кошти плану й власні кошти, яких не забрали купівлі цілих ОВДП"
          value={formatMoney(leftover, currency)}
        />
      )}
    </Section>
  );
}
