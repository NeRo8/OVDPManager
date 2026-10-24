import { Fragment, type ReactNode } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { InfoRow, Section, Separator, Typography } from '@/shared/ui';
import { type CurrencyYield, KEY_RATE_CURRENCY } from '../model/yieldReport';
import { pointsCell } from './reportCells';

type Props = {
  report: CurrencyYield;
};

/** One currency's bonds: their average yield, the key rate today and the gap between them. */
export function YieldSummary({ report }: Props) {
  const { currency, averageYield, averageRate, keyRate, bonds, withoutYield } = report;
  const gap = averageYield !== null && keyRate !== null ? averageYield - keyRate : null;
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: 'Середня річна дохідність',
      value: averageYield === null ? 'Немає повних даних НБУ' : `${averageYield}%`,
    },
    ...(keyRate !== null ? [{ label: 'Облікова ставка НБУ сьогодні', value: `${keyRate}%` }] : []),
    ...(gap !== null
      ? [
          {
            label: 'Різниця з обліковою ставкою',
            value: (
              <Typography
                variant="subhead"
                weight="semibold"
                tone={gap >= 0 ? 'positive' : 'danger'}
                tabular
              >
                {pointsCell(gap)}
              </Typography>
            ),
          },
        ]
      : []),
    ...(averageRate !== null ? [{ label: 'Середня ставка купону', value: `${averageRate}%` }] : []),
    { label: 'ОВДП', value: String(bonds.length) },
  ];

  return (
    <Section
      title={`Дохідність · ${CURRENCY_NAMES[currency]}`}
      footer={[
        'Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; середні зважені на суму купівель.',
        currency === KEY_RATE_CURRENCY
          ? 'Облікова ставка — НБУ, на сьогодні; у рядках — на дату купівлі, для запланованої купівлі — сьогоднішня.'
          : 'Облікова ставка НБУ — гривнева, тож валютні ОВДП з нею не порівнюються.',
        withoutYield > 0 &&
          `ОВДП без повних даних НБУ (${withoutYield}) у середню дохідність не враховано.`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {rows.map((row, index) => (
        <Fragment key={row.label}>
          {index > 0 && <Separator />}
          <InfoRow label={row.label} value={row.value} />
        </Fragment>
      ))}
    </Section>
  );
}
