import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import { Percent } from '@/components/typography/Percent';
import type { Bond } from '@/lib/portfolio/portfolio';
import { formatDate } from '@/utils/date';

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
