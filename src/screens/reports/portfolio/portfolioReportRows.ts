import type { ReportRow, ReportSection } from '@/screens/reports/shared/reportSection';
import { formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';

import type { CurrencyPortfolio, PortfolioBond } from './portfolioReport';

function bondState(bond: PortfolioBond): string {
  if (bond.state === 'unknown') return 'Немає даних облігації';
  if (bond.state === 'sold') return 'Продано';
  if (bond.state === 'redeemed') return 'Погашено';
  if (bond.state === 'planned') return 'Заплановано';
  return bond.bond ? `До ${formatDate(bond.bond.maturityDate)}` : 'Невідомо';
}

/** The same rows are used by the screen and the exported document. */
export function portfolioReportSections(reports: CurrencyPortfolio[]): ReportSection[] {
  return reports.flatMap(({ currency, total, planned, bonds, unknownCount }) => {
    const money = (value: number) => formatMoney(value, currency);
    const summary: ReportRow[] = [
      { label: 'Облігацій', value: String(bonds.length) },
      { label: 'Вкладено', value: money(total.invested) },
      ...(planned > 0 ? [{ label: 'З них заплановано', value: money(planned) }] : []),
      { label: 'Купони', value: money(total.coupons) },
      { label: 'Погашення', value: money(total.redemption) },
      { label: 'Продажі', value: money(total.saleProceeds) },
      { label: 'Усього надходжень', value: money(total.totalPayments) },
      { label: 'Отримано', value: money(total.received) },
      { label: 'Очікується', value: money(total.expected) },
      { label: 'Чистий дохід', value: total.netIncome === null ? '—' : money(total.netIncome) },
      {
        label: 'Дохідність за весь строк',
        value: total.returnPercent === null ? '—' : formatPercent(total.returnPercent),
      },
      {
        label: 'Річна дохідність',
        value: total.annualYield === null ? '—' : formatPercent(total.annualYield),
      },
    ];
    const notes = [
      unknownCount
        ? `Без даних облігації: ${unknownCount}. Їхню вартість враховано, а виплати та дохід — ні.`
        : '',
      total.incompleteCount
        ? `Без опублікованого погашення: ${total.incompleteCount}. Ці позиції не враховано в чистому доході.`
        : '',
      total.withoutYieldCount
        ? `Без розрахованої річної дохідності: ${total.withoutYieldCount}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    return [
      {
        title: `Підсумок · ${currency}`,
        rows: summary,
        footer: notes || undefined,
        chart: {
          currency,
          bars: [...bonds]
            .sort((a, b) => b.invested - a.invested)
            .slice(0, 5)
            .map((bond) => ({ label: bond.isin, value: bond.invested })),
        },
      },
      ...bonds.map((bond): ReportSection => ({
        title: bond.isin,
        rows: [
          { label: 'Стан', value: bondState(bond) },
          { label: 'Кількість', value: String(bond.quantity) },
          { label: 'Вкладено', value: money(bond.invested) },
          ...(bond.planned > 0 ? [{ label: 'З них заплановано', value: money(bond.planned) }] : []),
          ...(bond.results
            ? [
                { label: 'Купони', value: money(bond.results.coupons) },
                { label: 'Погашення', value: money(bond.results.redemption) },
                { label: 'Продажі', value: money(bond.results.saleProceeds) },
                {
                  label: 'Чистий дохід',
                  value: bond.results.netIncome === null ? '—' : money(bond.results.netIncome),
                },
              ]
            : []),
          {
            label: 'Річна дохідність',
            value: bond.annualYield === null ? '—' : formatPercent(bond.annualYield),
          },
          {
            label: 'Частка вкладень',
            value: bond.investedShare === null ? '—' : formatPercent(bond.investedShare),
          },
        ],
        footer:
          bond.results && !bond.results.complete
            ? 'Погашення ще не опубліковано, тому чистий дохід невідомий.'
            : undefined,
      })),
    ];
  });
}
