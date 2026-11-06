import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

import type { CurrencyRedemptions } from './redemptionsReport';

export function redemptionsReportSections(reports: CurrencyRedemptions[]): ReportSection[] {
  return reports.flatMap(({ currency, total, received, expected, planned, entries, years }) => {
    const money = (value: number) => formatMoney(value, currency);
    const share = (value: number) =>
      total > 0 ? formatPercent(round2((value / total) * 100)) : '—';
    return [
      {
        title: `Підсумок · ${currency}`,
        chart: {
          currency,
          bars: years.map(({ year, total: amount }) => ({ label: String(year), value: amount })),
        },
        rows: [
          { label: 'Усього погашень', value: money(total) },
          { label: 'Отримано', value: money(received) },
          { label: 'Очікується', value: money(expected) },
          ...(planned ? [{ label: 'Із запланованих купівель', value: money(planned) }] : []),
        ],
        footer: 'Погашення повертає номінал облігацій, а не ціну купівлі.',
      },
      {
        title: `За роками й кварталами · ${currency}`,
        rows: years.flatMap(({ year, total: yearTotal, quarters }) => [
          { label: String(year), value: money(yearTotal) },
          { label: `Частка · ${year}`, value: share(yearTotal) },
          ...quarters.flatMap(({ quarter, total: quarterTotal }) => [
            { label: `${year} · ${quarter} кв.`, value: money(quarterTotal) },
            { label: `Частка · ${year} · ${quarter} кв.`, value: share(quarterTotal) },
          ]),
        ]),
        footer:
          'Частка — від усіх погашень у звіті. Через округлення сума часток може відрізнятися від 100%.',
      },
      ...entries.map(
        ({ payment, received: paid, expected: pending, planned: fromPlanned }): ReportSection => ({
          title: `${payment.isin} · ${formatDate(payment.date)}`,
          rows: [
            { label: 'Сума', value: money(round2(paid + pending)) },
            { label: 'Отримано', value: money(paid) },
            { label: 'Очікується', value: money(pending) },
            ...(fromPlanned
              ? [{ label: 'Із запланованих купівель', value: money(fromPlanned) }]
              : []),
          ],
        }),
      ),
    ];
  });
}
