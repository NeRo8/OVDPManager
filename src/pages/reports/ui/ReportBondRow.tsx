import type { Currency } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { LegendRow, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { BondReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';
import { ReportItem } from './ReportItem';
import { shareCell } from './reportCells';

type Props = {
  bond: BondReport;
  currency: Currency;
  terms: ReportTerms;
};

/**
 * What one bond paid, cost and earned in the report, with its yield and its share of the report's
 * income; of the payments and purchases only the sums it had are listed.
 */
export function ReportBondRow({ bond, currency, terms }: Props) {
  return (
    <ReportItem
      title={bond.isin}
      aside={
        bond.annualYield !== null && (
          <Typography variant="caption1" tone="secondary" tabular>
            {bond.annualYield}% річних
          </Typography>
        )
      }
    >
      {bond.coupons > 0 && (
        <LegendRow color="coupon" label="Купони" value={formatMoney(bond.coupons, currency)} />
      )}
      {bond.redemptions > 0 && (
        <LegendRow
          color="redemption"
          label="Погашення"
          value={formatMoney(bond.redemptions, currency)}
        />
      )}
      {bond.invested > 0 && (
        <LegendRow color="purchase" label="Купівлі" value={formatMoney(bond.invested, currency)} />
      )}
      <TotalRow
        label={terms.income}
        value={formatMoney(bond.income, currency)}
        signedValue={bond.income}
      />
      {bond.incomeShare !== null && (
        <ShareBar
          percent={Math.min(bond.incomeShare, 100)}
          accessibilityLabel={`Частка в доході ${terms.span}`}
          caption={`${shareCell(bond.incomeShare)} доходу ${terms.span}`}
        />
      )}
    </ReportItem>
  );
}
