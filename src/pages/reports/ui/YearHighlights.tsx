import { Fragment } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator } from '@/shared/ui';
import type { CurrencyYears } from '../model/yearOverYearReport';

type Props = {
  report: CurrencyYears;
};

/** The years that stand out in one currency: the largest income, payments and purchases. */
export function YearHighlights({ report }: Props) {
  const { currency, highlights } = report;
  const { highestIncome, highestPayments, highestInvested } = highlights;
  const rows = [
    highestIncome && {
      label: 'Найбільший дохід',
      year: highestIncome.year,
      value: highestIncome.income,
      signedValue: highestIncome.income,
    },
    highestPayments && {
      label: 'Найбільше виплат',
      year: highestPayments.year,
      value: highestPayments.totalPayments,
      signedValue: undefined,
    },
    highestInvested && {
      label: 'Найбільше вкладено',
      year: highestInvested.year,
      value: highestInvested.invested,
      signedValue: undefined,
    },
  ].filter((row) => !!row);
  if (!rows.length) return null;

  return (
    <Section title={`Роки, що вирізняються · ${CURRENCY_NAMES[currency]}`}>
      {rows.map((row, index) => (
        <Fragment key={row.label}>
          {index > 0 && <Separator />}
          <InfoRow
            label={row.label}
            hint={`${row.year} рік`}
            value={formatMoney(row.value, currency)}
            signedValue={row.signedValue}
          />
        </Fragment>
      ))}
    </Section>
  );
}
