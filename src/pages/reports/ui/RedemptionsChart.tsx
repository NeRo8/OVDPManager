import { CURRENCY_NAMES } from '@/entities/portfolio';

import { Card, ColumnChart } from '@/shared/ui';

import type { CurrencyRedemptions } from '../model/redemptionsReport';

import { yearColumns } from './yearColumns';

type Props = {
  report: CurrencyRedemptions;
};

/** How much the redemptions bring each year, in one currency; the title names the one series. */
export function RedemptionsChart({ report }: Props) {
  const { currency, years } = report;

  return (
    <Card title={`Погашення по роках · ${CURRENCY_NAMES[currency]}`}>
      <ColumnChart
        columns={yearColumns(years.map(({ year }) => year))}
        series={[
          { label: 'погашення', color: 'redemption', values: years.map(({ total }) => total) },
        ]}
        currency={currency}
      />
    </Card>
  );
}
