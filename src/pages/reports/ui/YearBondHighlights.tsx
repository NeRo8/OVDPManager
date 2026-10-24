import { Fragment } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator } from '@/shared/ui';
import type { CurrencyYear } from '../model/yearReport';

type Props = {
  report: CurrencyYear;
};

/** The bonds that stand out in the year: the highest and the lowest yield, the largest income. */
export function YearBondHighlights({ report }: Props) {
  const { currency, highlights } = report;
  const { highestYield, lowestYield, highestIncome } = highlights;
  const rows = [
    highestYield && {
      label: 'Найвища річна дохідність',
      bond: highestYield,
      value: `${highestYield.annualYield}%`,
    },
    lowestYield && {
      label: 'Найнижча річна дохідність',
      bond: lowestYield,
      value: `${lowestYield.annualYield}%`,
    },
    highestIncome && {
      label: 'Найбільший дохід за рік',
      bond: highestIncome,
      value: formatMoney(highestIncome.income, currency),
    },
  ].filter((row) => !!row);
  if (!rows.length) return null;

  return (
    <Section
      title={`Облігації року · ${CURRENCY_NAMES[currency]}`}
      footer="Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; для кількох купівель — середня, зважена на суму. Дохід за рік — купони й прибуток від погашень цього року."
    >
      {rows.map((row, index) => (
        <Fragment key={row.label}>
          {index > 0 && <Separator />}
          <InfoRow label={row.label} hint={row.bond.isin} value={row.value} />
        </Fragment>
      ))}
    </Section>
  );
}
