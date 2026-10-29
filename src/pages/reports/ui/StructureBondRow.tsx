import type { Currency } from '@/entities/portfolio';

import { formatDate, formatMoney, formatTimeLeft } from '@/shared/lib';
import { ShareBar, Typography } from '@/shared/ui';

import type { StructureBond } from '../model/structureReport';

import { shareCell } from './reportCells';
import { ReportItem } from './ReportItem';

type Props = {
  bond: StructureBond;
  currency: Currency;
  today: string;
};

/** One bond's part of its currency's money, with its rate and time left to maturity. */
export function StructureBondRow({ bond: row, currency, today }: Props) {
  const { isin, bond, amount, share } = row;

  return (
    <ReportItem
      title={isin}
      aside={
        <Typography variant="subhead" weight="semibold" tabular>
          {formatMoney(amount, currency)}
        </Typography>
      }
    >
      <Typography variant="caption1" tone="secondary" tabular>
        {bond.rate}% · до {formatDate(bond.maturityDate)} ·{' '}
        {formatTimeLeft(today, bond.maturityDate)}
      </Typography>
      <ShareBar
        percent={share}
        accessibilityLabel={`Частка ${isin}`}
        caption={`${shareCell(share)} грошей у валюті`}
      />
    </ReportItem>
  );
}
