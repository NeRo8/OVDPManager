import { formatAmount } from '@/shared/lib';

import { FORECAST_NOTE, changeCell, tableTitle, yearCell } from '../lib/reportCells';
import type { CurrencyYears } from '../model/yearOverYearReport';

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
        label: yearCell(year),
        cells: [
          formatAmount(year.balance),
          formatAmount(year.income),
          changeCell(year.incomeChange),
        ],
        signedCells: [
          year.balance,
          year.income,
          year.incomeChange === null ? null : Math.round(year.incomeChange),
        ],
      }))}
      total={{
        label: 'Разом',
        cells: [formatAmount(total.balance), formatAmount(total.income), ''],
        signedCells: [total.balance, total.income, null],
      }}
      footer={[
        'Зміна доходу — дохід року проти попереднього. За малого попереднього доходу відсоток може бути великим. Не розраховується за від’ємного доходу або якщо попередній дохід дорівнює нулю.',
        years.some(({ forecast }) => forecast) && FORECAST_NOTE,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
