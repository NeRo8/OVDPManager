import type { Currency } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { LegendRow, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { PortfolioBond } from '../model/portfolioReport';
import { bondStateLabel } from './portfolioLabels';
import { ReportItem } from './ReportItem';
import { shareCell } from './reportCells';

type Props = {
  bond: PortfolioBond;
  currency: Currency;
};

/**
 * One bond of the wallet: where it stands, its rate and yield, what it cost and pays, its net
 * income over the term and its share of what the currency's bonds cost.
 */
export function PortfolioBondRow({ bond: row, currency }: Props) {
  const { isin, bond, state, quantity, invested, results, annualYield, investedShare } = row;
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
        state === 'unknown' ? (
          <Typography variant="caption1" tone="warning">
            Немає в даних НБУ
          </Typography>
        ) : (
          <Typography
            variant="caption1"
            tone={state === 'planned' ? 'accent' : 'secondary'}
            tabular
          >
            {bondStateLabel(state, bond?.maturityDate)}
          </Typography>
        )
      }
    >
      <Typography variant="caption1" tone="secondary" tabular>
        {details}
      </Typography>
      <LegendRow color="purchase" label="Вкладено" value={money(invested)} />
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
      <ShareBar
        percent={investedShare}
        accessibilityLabel="Частка у вкладеннях"
        caption={`${shareCell(investedShare)} вкладень`}
      />
    </ReportItem>
  );
}
