import type { Currency } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { ShareBar, Typography } from '@/shared/ui';

import type { YieldBond } from '../model/yieldReport';

import { bondStateLabel } from './portfolioLabels';
import { pointsCell } from './reportCells';
import { ReportItem } from './ReportItem';

type Props = {
  bond: YieldBond;
  currency: Currency;
  /** The highest yield in the currency: the full bar */
  highestYield: number;
};

/** One bond's yield as a bar against the highest, and against the key rate on its purchase dates. */
export function YieldBondRow({ bond: row, currency, highestYield }: Props) {
  const { isin, bond, state, invested, annualYield, keyRateAtPurchase } = row;
  const details = [
    bond && `купон ${bond.rate}%`,
    formatMoney(invested, currency),
    bondStateLabel(state, bond?.maturityDate),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ReportItem
      title={isin}
      aside={
        <Typography variant="subhead" weight="semibold" tabular>
          {annualYield === null ? '—' : `${annualYield}%`}
        </Typography>
      }
    >
      <Typography variant="caption1" tone={state === 'unknown' ? 'warning' : 'secondary'} tabular>
        {details}
      </Typography>
      {annualYield !== null && (
        <ShareBar
          percent={highestYield > 0 ? (Math.max(annualYield, 0) / highestYield) * 100 : 0}
          accessibilityLabel={`Річна дохідність ${isin}`}
        />
      )}
      {annualYield !== null && keyRateAtPurchase !== null && (
        <Typography variant="caption1" tone="secondary" tabular>
          облікова ставка на дату купівлі {keyRateAtPurchase}% ·{' '}
          {pointsCell(annualYield - keyRateAtPurchase)}
        </Typography>
      )}
    </ReportItem>
  );
}
