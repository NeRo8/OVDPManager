import { Fragment } from 'react';

import { CURRENCY_NAMES, ScheduleEventRow } from '@/entities/portfolio';
import { Section, Separator } from '@/shared/ui';
import type { CurrencyRedemptions } from '../model/redemptionsReport';

type Props = {
  report: CurrencyRedemptions;
};

/** Every redemption in one currency, by date. */
export function RedemptionsList({ report }: Props) {
  return (
    <Section title={`Усі погашення · ${CURRENCY_NAMES[report.currency]}`}>
      {report.payments.map((payment, index) => (
        <Fragment key={`${payment.isin}-${payment.date}`}>
          {index > 0 && <Separator />}
          <ScheduleEventRow event={payment} showIsin />
        </Fragment>
      ))}
    </Section>
  );
}
