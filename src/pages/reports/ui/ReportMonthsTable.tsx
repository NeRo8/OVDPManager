import { FLOW_COLUMNS, flowCells, monthName, tableTitle } from '../lib/reportCells';
import { periodChartPeriods } from '../model/periodChart';
import type { CurrencyReport } from '../model/periodReport';

import { ReportTable, type ReportTableLine } from './ReportTable';

type Props = {
  report: CurrencyReport;
};

const yearOf = (month: string) => month.slice(0, 4);

/**
 * Monthly flows for periods up to a year, or yearly flows for longer periods.
 */
export function ReportMonthsTable({ report }: Props) {
  const { months } = report;
  const byYear = months.length > 12;
  const periods = periodChartPeriods(months);
  const severalYears = yearOf(months[0].month) !== yearOf(months.at(-1)?.month ?? '');
  const rows = periods.flatMap((month, index): ReportTableLine[] => {
    if (byYear) return [{ key: month.month, label: month.month, cells: flowCells(month) }];
    const row = { key: month.month, label: monthName(month.month), cells: flowCells(month) };
    const year = yearOf(month.month);
    const startsYear = severalYears && year !== yearOf(months[index - 1]?.month ?? '');
    return startsYear
      ? [{ key: year, label: year, cells: FLOW_COLUMNS.map(() => ''), kind: 'total' }, row]
      : [row];
  });

  return (
    <ReportTable
      title={tableTitle(byYear ? 'По роках' : 'По місяцях', report.currency)}
      columns={FLOW_COLUMNS}
      rows={rows}
      total={{ label: 'Разом', cells: flowCells(report) }}
    />
  );
}
