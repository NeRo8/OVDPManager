import { type ReactNode } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, SignedValue } from '@/shared/ui';

import type { CurrencyPortfolio } from '../model/portfolioReport';

type Props = {
  report: CurrencyPortfolio;
};

/**
 * The bonds of one currency summed up as the plan sums them: what they cost, what they pay and
 * what they come to over their whole term.
 */
export function PortfolioSummary({ report }: Props) {
  const { currency, total, bonds, unknownCount } = report;
  const money = (value: number) => formatMoney(value, currency);
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'ОВДП', value: String(bonds.length) },
    ...(total
      ? [
          { label: 'Вкладено', value: money(total.invested) },
          { label: 'Купони', value: money(total.coupons) },
          { label: 'Погашення', value: money(total.redemption) },
          { label: 'Усього виплат', value: money(total.totalPayments) },
          ...(total.received > 0 && total.expected > 0
            ? [
                { label: 'Отримано', value: money(total.received) },
                { label: 'Очікується', value: money(total.expected) },
              ]
            : []),
          ...(total.netIncome !== null
            ? [
                {
                  label: 'Чистий дохід',
                  value: (
                    <SignedValue value={total.netIncome} variant="subhead" weight="semibold">
                      {money(total.netIncome)}
                    </SignedValue>
                  ),
                },
                { label: 'Дохідність за весь строк', value: `${total.returnPercent ?? 0}%` },
              ]
            : []),
        ]
      : []),
  ];

  return (
    <Section
      title={`Підсумок · ${CURRENCY_NAMES[currency]}`}
      footer={[
        'Чистий дохід — виплати мінус вкладення; дохідність за весь строк — він у відсотках від вкладень, без перерахунку на рік, податків і комісій.',
        unknownCount > 0 &&
          `ОВДП, яких немає в даних НБУ (${unknownCount}), не враховано в підсумку.`,
        total &&
          total.incompleteCount > 0 &&
          `НБУ ще не опублікував погашення ${total.incompleteCount} ОВДП: у погашенні й виплатах їх немає, а чистий дохід і дохідність за весь строк рахуються без них.`,
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
