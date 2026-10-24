import type { CurrencyYears } from '../model/yearOverYearReport';
import { amountCell, changeCell, tableTitle } from './reportCells';
import { ReportTable } from './ReportTable';

type Props = {
  report: CurrencyYears;
};

/** What each year came to in one currency, and how its income compares with the year before. */
export function YearsResultsTable({ report }: Props) {
  const { years, total } = report;

  return (
    <ReportTable
      title={tableTitle('Підсумки по роках', report.currency)}
      columns={['Сальдо', 'Дохід', 'Зміна доходу']}
      rows={years.map((year) => ({
        key: String(year.year),
        label: String(year.year),
        cells: [amountCell(year.balance), amountCell(year.income), changeCell(year.incomeChange)],
      }))}
      total={{ label: 'Разом', cells: [amountCell(total.balance), amountCell(total.income), ''] }}
      footer="Зміна доходу — дохід року проти попереднього. Майбутні роки — за графіком виплат і запланованими купівлями."
    />
  );
}
