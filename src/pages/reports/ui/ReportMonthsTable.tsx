import { MONTHS_SHORT } from '@/shared/lib';

import type { CurrencyReport } from '../model/periodReport';

import { FLOW_COLUMNS, flowCells, tableTitle } from './reportCells';
import { ReportTable, type ReportTableLine } from './ReportTable';

type Props = {
  report: CurrencyReport;
};

const yearOf = (month: string) => month.slice(0, 4);
const monthName = (month: string) => MONTHS_SHORT[Number(month.slice(5, 7)) - 1];

/**
 * Every month of the report in one currency. When the months span several years, each year's
 * months follow a row with the year.
 */
export function ReportMonthsTable({ report }: Props) {
  const { months } = report;
  const severalYears = yearOf(months[0].month) !== yearOf(months.at(-1)?.month ?? '');
  const rows = months.flatMap((month, index): ReportTableLine[] => {
    const row = { key: month.month, label: monthName(month.month), cells: flowCells(month) };
    const year = yearOf(month.month);
    const startsYear = severalYears && year !== yearOf(months[index - 1]?.month ?? '');
    return startsYear
      ? [{ key: year, label: year, cells: FLOW_COLUMNS.map(() => ''), kind: 'total' }, row]
      : [row];
  });

  return (
    <ReportTable
      title={tableTitle('По місяцях', report.currency)}
      columns={FLOW_COLUMNS}
      rows={rows}
      total={{ label: 'Разом', cells: flowCells(report) }}
    />
  );
}
