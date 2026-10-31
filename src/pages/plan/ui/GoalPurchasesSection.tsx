import { type GoalPurchase } from '@/features/coupon-goal';

import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

type Props = {
  purchases: GoalPurchase[];
  planName: string;
  year: number;
};

/** The goal's purchases by date, as the «План з ціллю» will hold them. */
export function GoalPurchasesSection({ purchases, planName, year }: Props) {
  return (
    <Section
      title="Купівлі за датами"
      footer={`Купівлі датовані днями, коли надходять гроші: купони й погашення плану або власні кошти на початку місяця. План «${planName}» не зміниться: буде створено його копію «${planName} · ціль ${year}» з цими купівлями, і вона стане активною.`}
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
