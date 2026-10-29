import type { Currency } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import type { HoldOrSell } from '../model/holdOrSell';

import { breakEvenText } from './saleTexts';

type Props = {
  assessment: HoldOrSell;
  currency: Currency;
};

/** The prices per bond that decide a sale: the lowest without a loss and the one above which selling pays. */
export function SalePricesSection({ assessment, currency }: Props) {
  const { breakEvenPrice, sellAbovePrice } = assessment;
  return (
    <Section title="Ціни продажу">
      <InfoRow
        label="Продаж без збитку"
        value={breakEvenText(breakEvenPrice, currency)}
        hint={
          breakEvenPrice === 0
            ? 'Отримані виплати вже повернули вкладене'
            : 'Нижче цієї ціни виплати й ціна продажу не повернуть вкладене'
        }
      />
      {sellAbovePrice !== null && (
        <InfoRow
          label="Вигідніше продати"
          value={`понад ${formatMoney(sellAbovePrice, currency)}`}
          hint="Вище цієї ціни гроші з продажу заробили б у новій ОВДП більше, ніж у цій до погашення"
        />
      )}
    </Section>
  );
}
