import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';
import type { Bond } from '../model/portfolio';

type Props = {
  bond: Bond;
};

/** The issue's terms from the NBU data, the same on the purchase form and the bond's screen. */
export function BondParameters({ bond }: Props) {
  const coupon = bond.payments.find((payment) => payment.type === 'coupon');
  return (
    <Section title="Параметри випуску">
      <InfoRow label="Ставка купону" value={`${bond.rate}% річних`} />
      <InfoRow label="Номінал" value={formatMoney(bond.nominal, bond.currency)} />
      <InfoRow
        label="Купон на 1 шт"
        value={coupon ? formatMoney(coupon.amount, bond.currency) : 'без купону'}
      />
      <InfoRow label="Дата розміщення" value={formatDate(bond.issueDate)} />
      <InfoRow label="Дата погашення" value={formatDate(bond.maturityDate)} />
      <InfoRow label="Тип" value={bond.description} />
    </Section>
  );
}
