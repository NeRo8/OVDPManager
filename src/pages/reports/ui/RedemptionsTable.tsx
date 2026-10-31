import { QUARTER_LABELS, amountCell, shareCell, tableTitle } from '../lib/reportCells';
import type { CurrencyRedemptions } from '../model/redemptionsReport';

import { ReportTable, type ReportTableLine } from './ReportTable';

type Props = {
  report: CurrencyRedemptions;
};

/** Each year's redemptions in one currency, then its quarters that have any. */
export function RedemptionsTable({ report }: Props) {
  const rows = report.years.flatMap(({ year, total, share, quarters }): ReportTableLine[] => [
    {
      key: String(year),
      label: String(year),
      cells: [amountCell(total), total > 0 ? shareCell(share) : '—'],
      kind: 'total',
    },
    ...quarters.map((quarter) => ({
      key: `${year}-${quarter.quarter}`,
      label: QUARTER_LABELS[quarter.quarter],
      cells: [amountCell(quarter.total), shareCell(quarter.share)],
    })),
  ]);

  return (
    <ReportTable
      title={tableTitle('По роках і кварталах', report.currency)}
      columns={['Сума', 'Частка']}
      rows={rows}
      total={{ label: 'Разом', cells: [amountCell(report.total), '100%'] }}
      footer="Частка — від усіх погашень у звіті."
    />
  );
}
