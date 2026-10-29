import { CURRENCY_NAMES } from '@/entities/portfolio';

import { Card, ColumnChart } from '@/shared/ui';

import type { CurrencyPortfolio } from '../model/portfolioReport';

type Props = { report: CurrencyPortfolio };

/** The largest bond positions by purchase cost, within one currency. */
export function PortfolioInvestmentChart({ report }: Props) {
  const bonds = [...report.bonds].sort((a, b) => b.invested - a.invested).slice(0, 5);

  return (
    <Card
      title={`Вкладення за ОВДП · ${CURRENCY_NAMES[report.currency]}`}
      footer={
        report.bonds.length > bonds.length &&
        'Показано 5 найбільших вкладень; усі ОВДП наведено нижче.'
      }
    >
      <ColumnChart
        orientation="horizontal"
        columns={bonds.map(({ isin }) => ({ label: isin, name: `ОВДП ${isin}` }))}
        series={[
          { label: 'вкладено', color: 'purchase', values: bonds.map(({ invested }) => invested) },
        ]}
        currency={report.currency}
      />
    </Card>
  );
}
