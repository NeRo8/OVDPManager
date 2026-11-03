import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import type { Currency } from '@/lib/portfolio/portfolio';

import type { HoldOrSell } from './holdOrSell';
import { breakEvenText } from './saleTexts';

type Props = {
  assessment: HoldOrSell;
  currency: Currency;
};

/** The prices per bond that decide a sale: the lowest without a loss and the one above which selling pays. */
export function SalePricesSection({ assessment, currency }: Props) {
  const { breakEvenPrice, sellAbovePrice } = assessment;
  return (
    <Section
      title="Ціни продажу"
      footer="Виплату в день продажу враховано продавцю, хоча на картці вона стане отриманою наступного дня. Орієнтир нових ОВДП — медіана ставок купону; фактична дохідність залежить від ціни купівлі й може відрізнятися."
    >
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
          value={
            <>
              понад <Money value={sellAbovePrice} currency={currency} />
            </>
          }
          hint="Вище цієї ціни гроші за ставкою орієнтира заробили б більше, ніж у цій ОВДП до погашення"
        />
      )}
    </Section>
  );
}
