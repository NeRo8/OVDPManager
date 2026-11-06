import { CURRENCIES, receivedAmount } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { cashFlowReport } from '@/screens/reports/cash-flow/cashFlowReport';
import { flowTables } from '@/screens/reports/shared/flowTables';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

import { bondCapitalChart } from './bondCapital';
import { structureReportSections } from './structureReportSections';
import { purchaseKeyRate, yieldReportSections } from './yieldReportSections';

export type PositionReportMode = 'structure' | 'yield' | 'bond';

export function positionReportSections(
  wallet: Wallet,
  mode: PositionReportMode,
  isin: string | null,
  keyRate: number | null,
  purchases: 'all' | 'made' = 'all',
  rateOn: (date: string) => number | null = () => null,
): ReportSection[] {
  if (mode === 'bond') {
    const item = wallet.positions.find((position) => position.position.isin === isin);
    if (!item) return [];
    const { position, currency, results, annualYield, bond } = item;
    const money = (amount: number) => formatMoney(amount, currency);
    const sections: ReportSection[] = [
      {
        title: position.isin,
        rows: [
          { label: 'Кількість', value: String(position.quantity) },
          { label: 'Вкладено', value: money(position.investedAmount) },
          { label: 'Заплановано', value: money(item.planned.amount) },
          { label: 'Дата погашення', value: bond ? formatDate(bond.maturityDate) : '—' },
          { label: 'Ставка купону', value: bond ? formatPercent(bond.rate) : '—' },
          { label: 'Купони', value: results ? money(results.coupons) : '—' },
          { label: 'Погашення', value: results ? money(results.redemption) : '—' },
          { label: 'Продажі', value: results ? money(results.saleProceeds) : '—' },
          {
            label: 'Чистий дохід',
            value: results?.netIncome == null ? '—' : money(results.netIncome),
          },
          {
            label: 'Річна дохідність',
            value: annualYield === null ? '—' : formatPercent(annualYield),
          },
          ...(currency === 'UAH'
            ? [
                {
                  label: 'Ставка НБУ на дати купівлі',
                  value: (() => {
                    const rate = purchaseKeyRate(position.operations, rateOn);
                    return rate === null ? '—' : formatPercent(rate);
                  })(),
                },
              ]
            : []),
        ],
        footer:
          results && !results.complete ? 'Дані погашення неповні, дохід невідомий.' : undefined,
      },
    ];
    const events = [...wallet.operationEvents, ...wallet.payments].filter(
      (event) => event.isin === isin,
    );
    const years = [...new Set(events.map((event) => event.date.slice(0, 4)))].sort();
    const alone = {
      ...wallet,
      positions: [item],
      operationEvents: wallet.operationEvents.filter((event) => event.isin === isin),
      payments: wallet.payments.filter((event) => event.isin === isin),
    };
    const capitalChart = bondCapitalChart(item, wallet.today);
    if (capitalChart)
      sections.push({
        title: `Вкладення та надходження · ${currency}`,
        rows: [],
        capitalChart,
        footer: `Залишок вкладень — собівартість, а не ринкова вартість. Надходження включають купони, продажі та погашення. Факт після сьогодні не змінюється. План включає майбутні виплати й непідтверджені операції, зокрема прострочені.${capitalChart.actualAvailable ? '' : ' Фактичний залишок недоступний: підтверджений продаж залежить від непідтвердженої купівлі.'}`,
      });
    else if (!bond)
      sections.push({
        title: 'Вкладення та надходження',
        rows: [{ label: 'Графік', value: 'Немає даних облігації' }],
      });
    const yearlyFlows = years.flatMap((year) => {
      const flow = cashFlowReport(alone, `${year}-01-01`, `${year}-12-31`)[0];
      return flow ? [{ year, flow }] : [];
    });
    if (yearlyFlows.length) {
      sections.push(
        ...flowTables(
          currency,
          yearlyFlows.map(({ year, flow }) => ({
            label: year,
            purchases: flow.purchases - flow.plannedPurchases,
            planned: flow.plannedPurchases,
            coupons: flow.coupons,
            redemptions: flow.redemptions,
            sales: flow.sales,
          })),
        ).map((section) => ({ ...section, chart: undefined })),
        {
          title: `Дохід за роками · ${currency}`,
          rows: yearlyFlows.map(({ year, flow }) => ({
            label: year,
            value: flow.income === null ? '—' : money(flow.income),
          })),
        },
      );
    }
    position.operations.forEach((operation, index) => {
      sections.push({
        title: `${operation.type === 'purchase' ? 'Купівля' : 'Продаж'} · ${formatDate(operation.date)} · ${index + 1}`,
        rows: [
          { label: 'Кількість', value: String(operation.quantity) },
          { label: 'Сума', value: money(operation.amount) },
          { label: 'Стан', value: operation.planned ? 'Заплановано' : 'Підтверджено' },
        ],
      });
    });
    item.payments.forEach((payment, index) => {
      const received = round2(receivedAmount(payment));
      sections.push({
        title: `${payment.type === 'coupon' ? 'Купон' : 'Погашення'} · ${formatDate(payment.date)} · ${index + 1}`,
        rows: [
          { label: 'Кількість', value: String(payment.quantity) },
          { label: 'Сума', value: money(payment.total) },
          { label: 'Отримано', value: money(received) },
          { label: 'Очікується', value: money(round2(payment.total - received)) },
        ],
      });
    });
    return sections;
  }
  return CURRENCIES.flatMap((currency): ReportSection[] => {
    const positions = wallet.positions.filter((item) => item.currency === currency);
    if (!positions.length) return [];
    if (mode === 'yield') return yieldReportSections(currency, positions, keyRate, rateOn);
    return structureReportSections(currency, positions, wallet.today, purchases);
  });
}
