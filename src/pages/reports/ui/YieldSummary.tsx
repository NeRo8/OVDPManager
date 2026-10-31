import { type ReactNode } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { InfoRow, Section, SignedValue } from '@/shared/ui';

import { pointsCell } from '../lib/reportCells';
import { type CurrencyYield, KEY_RATE_CURRENCY } from '../model/yieldReport';

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
            label: 'Різниця зі ставкою сьогодні',
            value: (
              <SignedValue
                value={Math.round(gap * 10) / 10}
                variant="subhead"
                weight="semibold"
                tabular
              >
                {pointsCell(gap)}
              </SignedValue>
            ),
          },
        ]
      : []),
    ...(averageRate !== null ? [{ label: 'Середня ставка купону', value: `${averageRate}%` }] : []),
    { label: 'ОВДП', value: String(bonds.length) },
  ];

  return (
    <Section
      title={`Річна дохідність · ${CURRENCY_NAMES[currency]}`}
      footer={[
        'Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; середні зважені на суму купівель.',
        currency === KEY_RATE_CURRENCY
          ? 'Порівняння зі ставкою сьогодні використовує дохідність за ціною купівлі, а не за поточною ринковою ціною. У рядках ставка на дату купівлі; для запланованої — сьогоднішня.'
          : 'Облікова ставка НБУ — гривнева, тож валютні ОВДП з нею не порівнюються.',
        currency === KEY_RATE_CURRENCY &&
          (keyRate === null || bonds.some((bond) => bond.keyRateAtPurchase === null)) &&
          'Деякі облікові ставки ще недоступні або не завантажилися; відповідні порівняння не показано.',
        withoutYield > 0 &&
          `ОВДП без повних даних НБУ (${withoutYield}) у середню річну дохідність не враховано.`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} value={row.value} />
      ))}
    </Section>
  );
}
