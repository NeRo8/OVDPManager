import { type GoalPurchase } from '@/features/coupon-goal';

import { type CouponGoal, goalYearsLabel } from '@/entities/portfolio';

import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

type Props = {
  purchases: GoalPurchase[];
  planName: string;
  goal: CouponGoal;
};

/** The goal's purchases by date, as the «План з ціллю» will hold them. */
export function GoalPurchasesSection({ purchases, planName, goal }: Props) {
  const money = goal.reinvest
    ? 'купони й погашення плану та ОВДП під ціль або власні кошти на початку місяця'
    : 'власні кошти на початку місяця';

  return (
    <Section
      title="Купівлі за датами"
      footer={`Купівлі датовані днями, коли надходять гроші: ${money}. План «${planName}» не зміниться: буде створено його копію «${planName} · ціль ${goalYearsLabel(goal)}» з цими купівлями, і вона стане активною.`}
    >
      {purchases.map(({ isin, purchaseDate, quantity, amount, currency }) => (
        <InfoRow
          key={`${purchaseDate}-${isin}`}
          label={formatDate(purchaseDate)}
          hint={isin}
          value={`${quantity} шт · ${formatMoney(amount, currency)}`}
        />
      ))}
    </Section>
  );
}
