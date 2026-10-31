import type { Currency } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { LegendRow, ShareBar, TotalRow, Typography } from '@/shared/ui';

import { bondStateLabel } from '../lib/portfolioLabels';
import { shareCell } from '../lib/reportCells';
import type { PortfolioBond } from '../model/portfolioReport';

import { ReportItem } from './ReportItem';

type Props = {
  bond: PortfolioBond;
  currency: Currency;
};

/**
 * One bond of the wallet: where it stands, its rate and yield, what it cost and pays, its net
 * income over the term and its share of what the currency's bonds cost.
 */
export function PortfolioBondRow({ bond: row, currency }: Props) {
  const { isin, bond, state, quantity, invested, planned, results, annualYield } = row;
  const { investedShare } = row;
  const money = (value: number) => formatMoney(value, currency);
  const details = [
    bond && `${bond.rate}%`,
    `${quantity} шт`,
    annualYield !== null && `${annualYield}% річних`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ReportItem
      title={isin}
      aside={
        <Typography
          variant="caption1"
          tone={state === 'unknown' ? 'warning' : state === 'planned' ? 'accent' : 'secondary'}
          tabular
        >
          {bondStateLabel(state, bond?.maturityDate)}
        </Typography>
      }
    >
      <Typography variant="caption1" tone="secondary" tabular>
        {details}
      </Typography>
      <LegendRow color="purchase" label="Вкладено" value={money(invested)} />
      {planned > 0 && planned < invested && (
        <Typography variant="caption1" tone="secondary">
          з них заплановано {money(planned)}
        </Typography>
      )}
      {results && (
        <>
          <LegendRow color="coupon" label="Купони" value={money(results.coupons)} />
          <LegendRow
            color="redemption"
            label="Погашення"
            value={results.complete ? money(results.redemption) : 'Немає повних даних НБУ'}
          />
          <TotalRow
            label="Чистий дохід"
            value={results.netIncome === null ? '—' : money(results.netIncome)}
            signedValue={results.netIncome ?? undefined}
          />
          {results.received > 0 && results.expected > 0 && (
            <Typography variant="caption1" tone="secondary">
              отримано {money(results.received)}, очікується {money(results.expected)}
            </Typography>
          )}
        </>
      )}
      {investedShare !== null && (
        <ShareBar
          percent={investedShare}
          accessibilityLabel="Частка у вкладеннях"
          caption={`${shareCell(investedShare)} вкладень`}
        />
      )}
    </ReportItem>
  );
}
