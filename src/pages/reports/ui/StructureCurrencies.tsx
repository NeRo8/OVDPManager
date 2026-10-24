import { Fragment } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { currencySign, formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator } from '@/shared/ui';
import type { CurrencyStructure } from '../model/structureReport';

type Props = {
  currencies: CurrencyStructure[];
};

/** The money in each currency side by side; there is no rate to turn them into shares. */
export function StructureCurrencies({ currencies }: Props) {
  return (
    <Section
      title="За валютами"
      footer="Суми в різних валютах не складаються без курсу, тож частки нижче рахуються в межах кожної валюти."
    >
      {currencies.map(({ currency, total, bonds }, index) => (
        <Fragment key={currency}>
          {index > 0 && <Separator />}
          <InfoRow
            label={`${currencySign(currency)} ${CURRENCY_NAMES[currency]}`}
            hint={`ОВДП: ${bonds.length}`}
            value={formatMoney(total, currency)}
          />
        </Fragment>
      ))}
    </Section>
  );
}
