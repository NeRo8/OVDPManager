import type { ExchangeCurrency } from '@/entities/portfolio';

import type { FxReport } from '../model/fxReport';

import { amountCell } from './reportCells';
import { ReportTable } from './ReportTable';

type Props = { report: FxReport; currency: ExchangeCurrency };

/** Yearly cash flows within the all-time FX report. */
export function FxYearsTable({ report, currency }: Props) {
  return (
    <ReportTable
      title={`Рух грошей по роках · ${currency}`}
      columns={['Купівлі', 'Виплати', 'Сальдо']}
      rows={report.years.map(({ year, purchases, coupons, redemptions, balance }) => ({
        key: String(year),
        label: String(year),
        cells: [amountCell(purchases), amountCell(coupons + redemptions), amountCell(balance)],
        signedCells: [null, null, balance],
      }))}
      total={{
        label: 'Разом',
        cells: [
          amountCell(report.purchases),
          amountCell(report.coupons + report.redemptions),
          amountCell(report.balance),
        ],
        signedCells: [null, null, report.balance],
      }}
      footer="Виплати = купони + погашення. Сальдо — виплати мінус купівлі; воно не є заробітком на непогашених ОВДП."
    />
  );
}
