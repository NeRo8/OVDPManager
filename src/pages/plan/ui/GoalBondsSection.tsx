import { GOAL_BOND_MONTHS, type GoalBond } from '@/features/coupon-goal';

import { type CouponGoal, goalLastYear } from '@/entities/portfolio';

import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import { forYears, monthsPhrase } from './goalTexts';

type Props = {
  bonds: GoalBond[];
  goal: CouponGoal;
};

/** The bonds to buy for the goal, each with all its purchases together. */
export function GoalBondsSection({ bonds, goal }: Props) {
  const { currency } = goal;
  const years = forYears(goal.year, goalLastYear(goal));

  return (
    <Section
      title="Що купити"
      footer={`ОВДП, розміщені за останні ${GOAL_BOND_MONTHS} місяців. Вибір наближений і не обов’язково найдешевший. Майбутні ціни й наявність у банках можуть відрізнятися; розрахунок використовує сьогоднішню дохідність як орієнтир.`}
    >
      {bonds.map(({ bond, quantity, amount, coupons, months, marketYield }) => (
        <InfoRow
          key={bond.isin}
          label={bond.isin}
          hint={`Купони в ${monthsPhrase(months)} — ${formatMoney(coupons, currency)} ${years}. Ставка купону ${String(bond.rate).replace('.', ',')}%, погашення ${formatDate(bond.maturityDate)}, річна дохідність за орієнтовною ціною ${String(marketYield).replace('.', ',')}%`}
          value={`${quantity} шт · ${formatMoney(amount, currency)}`}
        />
      ))}
    </Section>
  );
}
