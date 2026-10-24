import { Fragment } from 'react';

import { CURRENCY_NAMES, type PositionPayment } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator } from '@/shared/ui';
import type { CurrencyRedemptions } from '../model/redemptionsReport';

type Props = {
  report: CurrencyRedemptions;
};

/** The redemptions in one currency summed up, with the nearest and the last one. */
export function RedemptionsSummary({ report }: Props) {
  const { currency, total, received, expected, next, last } = report;
  const money = (value: number) => formatMoney(value, currency);
  const describe = (payment: PositionPayment) => `${payment.isin} · ${formatDate(payment.date)}`;
  const rows = [
    { label: 'Усього погашень', value: money(total) },
    received > 0 && expected > 0 && { label: 'Отримано', value: money(received) },
    received > 0 && expected > 0 && { label: 'Очікується', value: money(expected) },
    next && { label: 'Найближче погашення', hint: describe(next), value: money(next.total) },
    last !== next && { label: 'Останнє погашення', hint: describe(last), value: money(last.total) },
  ].filter((row) => !!row);

  return (
    <Section title={`Підсумок · ${CURRENCY_NAMES[currency]}`}>
      {rows.map((row, index) => (
        <Fragment key={row.label}>
          {index > 0 && <Separator />}
          <InfoRow {...row} />
        </Fragment>
      ))}
    </Section>
  );
}
