import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import { Percent } from '@/components/typography/Percent';
import type { Bond } from '@/lib/portfolio/portfolio';
import { ANNUAL_YIELD_RANGE } from '@/lib/portfolio/yield';
import { formatDate } from '@/utils/date';

import type { HoldOrSell } from './holdOrSell';

type Props = { bond: Bond; assessment: HoldOrSell };

export function SaleComparisonSection({ bond, assessment }: Props) {
  const { sale, holdResult } = assessment;
  if (!sale) return null;
  return (
    <Section
      title="Що дасть продаж"
      footer="Порівняння враховує попередні продажі та виплати. Результат тримання охоплює також майбутні виплати на залишок."
    >
      <InfoRow
        label="Отримаєте за продаж"
        value={<Money value={sale.proceeds} currency={bond.currency} />}
      />
      <InfoRow
        label="Якщо продати сьогодні"
        value={<Money value={sale.saleResult} currency={bond.currency} />}
        signedValue={sale.saleResult}
      />
      <InfoRow
        label={`Якщо тримати до ${formatDate(bond.maturityDate)}`}
        value={<Money value={holdResult} currency={bond.currency} />}
        signedValue={holdResult}
      />
      <InfoRow
        label="Дохідність від сьогодні"
        value={
          sale.holdYield === null ? (
            <>
              нижче <Percent value={ANNUAL_YIELD_RANGE.lowest} />
            </>
          ) : (
            <Percent value={sale.holdYield} />
          )
        }
        hint="Дохідність майбутніх виплат відносно суми, яку можна отримати за залишок сьогодні"
      />
    </Section>
  );
}
