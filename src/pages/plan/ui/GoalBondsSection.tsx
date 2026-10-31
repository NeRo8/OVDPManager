import { GOAL_BOND_MONTHS, type GoalBond } from '@/features/coupon-goal';

import { type Currency } from '@/entities/portfolio';

import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import { monthsPhrase } from './goalTexts';

type Props = {
  bonds: GoalBond[];
  currency: Currency;
  year: number;
};

/** The bonds to buy for the goal, each with all its purchases together. */
export function GoalBondsSection({ bonds, currency, year }: Props) {
  return (
    <Section
      title="Що купити"
      footer={`ОВДП, розміщені за останні ${GOAL_BOND_MONTHS} місяців: такі продають банки й брокери. Сума — за орієнтовною ціною, за якої ОВДП дає таку саму річну дохідність, як нові ОВДП її строку сьогодні; справжню ціну буде видно лише в день купівлі.`}
    >
      {bonds.map(({ bond, quantity, amount, coupons, months, marketYield }) => (
        <InfoRow
          key={bond.isin}
          label={bond.isin}
          hint={`Купони в ${monthsPhrase(months)} — ${formatMoney(coupons, currency)} за ${year} рік. Ставка купону ${bond.rate}%, погашення ${formatDate(bond.maturityDate)}, річна дохідність за орієнтовною ціною ${marketYield}%`}
          value={`${quantity} шт · ${formatMoney(amount, currency)}`}
        />
      ))}
    </Section>
  );
}
