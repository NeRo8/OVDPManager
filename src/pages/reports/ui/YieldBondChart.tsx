import { CURRENCY_NAMES } from '@/entities/portfolio';

import { Card, ColumnChart } from '@/shared/ui';

import { type CurrencyYield, yieldChartBonds } from '../model/yieldReport';

type Props = { report: CurrencyYield };

/** Known annual yields on a shared percentage scale; losses extend left of zero. */
export function YieldBondChart({ report }: Props) {
  const known = report.bonds.filter(
    (bond): bond is typeof bond & { annualYield: number } => bond.annualYield !== null,
  );
  if (!known.length) return null;
  const shown = yieldChartBonds(known);

  return (
    <Card
      title={`Дохідність за ОВДП · ${CURRENCY_NAMES[report.currency]}`}
      footer={
        known.length > shown.length &&
        'Показано 4 найвищі та найнижчу дохідність; усі значення наведено нижче.'
      }
    >
      <ColumnChart
        orientation="horizontal"
        valueFormat="percent"
        columns={shown.map(({ isin }) => ({ label: isin, name: `ОВДП ${isin}` }))}
        series={[
          {
            label: 'річна дохідність',
            color: 'coupon',
            values: shown.map(({ annualYield }) => Math.max(0, annualYield)),
          },
          {
            label: 'від’ємна річна дохідність',
            color: 'purchase',
            direction: 'down',
            values: shown.map(({ annualYield }) => Math.max(0, -annualYield)),
          },
        ]}
        currency={report.currency}
      />
    </Card>
  );
}
