import type { CurrencyYears } from '../model/yearOverYearReport';
import { FLOW_COLUMNS, flowCells, tableTitle } from './reportCells';
import { ReportTable } from './ReportTable';

type Props = {
  report: CurrencyYears;
};

/** What went out and came in each year, in one currency. */
export function YearsFlowsTable({ report }: Props) {
  return (
    <ReportTable
      title={tableTitle('Рух грошей по роках', report.currency)}
      columns={FLOW_COLUMNS}
      rows={report.years.map((year) => ({
        key: String(year.year),
        label: String(year.year),
        cells: flowCells(year),
      }))}
      total={{ label: 'Разом', cells: flowCells(report.total) }}
    />
  );
}
