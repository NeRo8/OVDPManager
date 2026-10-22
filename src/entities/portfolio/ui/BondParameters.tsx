import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator } from '@/shared/ui';
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
      <Separator />
      <InfoRow label="Номінал" value={formatMoney(bond.nominal, bond.currency)} />
      <Separator />
      <InfoRow
        label="Купон на 1 шт"
        value={coupon ? formatMoney(coupon.amount, bond.currency) : 'без купону'}
      />
      <Separator />
      <InfoRow label="Розміщення" value={formatDate(bond.issueDate)} />
      <Separator />
      <InfoRow label="Погашення" value={formatDate(bond.maturityDate)} />
      <Separator />
      <InfoRow label="Тип" value={bond.description} />
    </Section>
  );
}
