import { type ReactNode } from 'react';

import { CURRENCY_NAMES, netIncomeBasis } from '@/entities/portfolio';

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
  const { currency, total, bonds, unknownCount, planned } = report;
  const money = (value: number) => formatMoney(value, currency);
  const rows: { label: string; value: ReactNode; hint?: string }[] = [
    { label: 'ОВДП', value: String(bonds.length) },
    ...(total
      ? [
          { label: 'Вкладено', value: money(total.invested) },
          ...(planned > 0
            ? [
                {
                  label: 'З них заплановано',
                  hint: 'Купівлі, яких ще не зроблено',
                  value: money(planned),
                },
              ]
            : []),
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
                  hint: netIncomeBasis(total),
                  value: (
                    <SignedValue value={total.netIncome} variant="subhead" weight="semibold">
                      {money(total.netIncome)}
                    </SignedValue>
                  ),
                },
                {
                  label: 'Дохідність за весь строк',
                  hint: total.incompleteCount
                    ? `Розраховано від вкладень ${money(total.published.invested)} в ОВДП з опублікованим погашенням`
                    : undefined,
                  value: total.returnPercent === null ? '—' : `${total.returnPercent}%`,
                },
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
          `НБУ ще не опублікував погашення ${total.incompleteCount} ОВДП: їхні купони у виплатах є, а погашення немає, тож чистий дохід і дохідність за весь строк рахуються без них — з тих сум, що під чистим доходом.`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} hint={row.hint} value={row.value} />
      ))}
    </Section>
  );
}
