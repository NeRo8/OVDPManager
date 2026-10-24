import { Fragment, type ReactNode } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator, Typography } from '@/shared/ui';
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
          {
            label: 'Погашення',
            value: total.complete ? money(total.redemption) : 'Немає повних даних НБУ',
          },
          ...(total.complete
            ? [{ label: 'Усього виплат', value: money(total.totalPayments) }]
            : []),
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
                    <Typography
                      variant="subhead"
                      weight="semibold"
                      tone={total.netIncome >= 0 ? 'positive' : 'danger'}
                    >
                      {money(total.netIncome)}
                    </Typography>
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
