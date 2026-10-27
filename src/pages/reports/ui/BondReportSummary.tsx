import { type ReactNode } from 'react';

import { pricePerBond } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, SignedValue } from '@/shared/ui';
import type { BondReport } from '../model/bondReport';
import { pointsCell } from './reportCells';

type Props = {
  report: BondReport;
};

/** What the bond cost, pays and earns over its whole term, and its yield next to the key rate. */
export function BondReportSummary({ report }: Props) {
  const { item, keyRateAtPurchase } = report;
  const { position, currency, results, annualYield } = item;
  const money = (value: number) => formatMoney(value, currency);
  const toned = (value: number, text: string) => (
    <SignedValue value={value} variant="subhead" weight="semibold" tabular>
      {text}
    </SignedValue>
  );
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Кількість', value: `${position.quantity} шт` },
    { label: 'Вкладено', value: money(position.investedAmount) },
    ...(position.purchases.length > 1
      ? [
          {
            label: 'Середня ціна 1 шт',
            value: money(pricePerBond(position.investedAmount, position.quantity)),
          },
        ]
      : []),
    ...(results
      ? [
          { label: 'Купони', value: money(results.coupons) },
          {
            label: 'Погашення',
            value: results.complete ? money(results.redemption) : 'Немає повних даних НБУ',
          },
          ...(results.complete
            ? [{ label: 'Усього виплат', value: money(results.totalPayments) }]
            : []),
          { label: 'Отримано', value: money(results.received) },
          { label: 'Очікується', value: money(results.expected) },
          ...(results.netIncome !== null
            ? [
                {
                  label: 'Чистий дохід',
                  value: toned(results.netIncome, money(results.netIncome)),
                },
                { label: 'Дохідність за весь строк', value: `${results.returnPercent ?? 0}%` },
              ]
            : []),
        ]
      : []),
    ...(annualYield !== null ? [{ label: 'Річна дохідність', value: `${annualYield}%` }] : []),
    ...(annualYield !== null && keyRateAtPurchase !== null
      ? [
          { label: 'Облікова ставка на дату купівлі', value: `${keyRateAtPurchase}%` },
          {
            label: 'Різниця з обліковою ставкою',
            value: toned(
              Math.round((annualYield - keyRateAtPurchase) * 10) / 10,
              pointsCell(annualYield - keyRateAtPurchase),
            ),
          },
        ]
      : []),
  ];

  return (
    <Section
      title="Підсумок"
      footer="Чистий дохід — виплати мінус вкладення; дохідність за весь строк — він у відсотках від вкладень. Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; облікова ставка — НБУ на дату купівлі (для запланованої — сьогоднішня), для кількох купівель зважена на суму."
    >
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} value={row.value} />
      ))}
    </Section>
  );
}
