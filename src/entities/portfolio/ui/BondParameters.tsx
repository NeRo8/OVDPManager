import { formatDate } from '@/shared/lib';
import { InfoRow, Money, Percent, Section } from '@/shared/ui';

import type { Bond } from '../model/portfolio';

type Props = {
  bond: Bond;
};

/** The issue's terms from the NBU data, the same on the purchase form and the bond's screen. */
export function BondParameters({ bond }: Props) {
  const coupon = bond.payments.find((payment) => payment.type === 'coupon');
  return (
    <Section title="Параметри випуску">
      <InfoRow
        label="Ставка купону"
        value={
          <>
            <Percent value={bond.rate} /> річних
          </>
        }
      />
      <InfoRow label="Номінал" value={<Money value={bond.nominal} currency={bond.currency} />} />
      <InfoRow
        label="Перший купон на 1 шт"
        value={
          coupon ? (
            <>
              <Money value={coupon.amount} currency={bond.currency} /> · {formatDate(coupon.date)}
            </>
          ) : (
            'немає даних'
          )
        }
      />
      <InfoRow label="Дата розміщення" value={formatDate(bond.issueDate)} />
      <InfoRow label="Дата погашення" value={formatDate(bond.maturityDate)} />
      <InfoRow label="Тип" value={bond.description} />
    </Section>
  );
}
