import { currencyTitle } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

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
      {currencies.map(({ currency, total, bonds }) => (
        <InfoRow
          key={currency}
          label={currencyTitle(currency)}
          hint={`ОВДП: ${bonds.length}`}
          value={formatMoney(total, currency)}
        />
      ))}
    </Section>
  );
}
