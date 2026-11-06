import { purchaseLots } from '@/lib/portfolio/operations';
import { CURRENCIES, receivedAmount } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { cashFlowReport } from '@/screens/reports/cash-flow/cashFlowReport';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { addDaysISO, addMonthsISO, daysBetween, formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

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
    for (const year of years) {
      const flow = cashFlowReport(alone, `${year}-01-01`, `${year}-12-31`)[0];
      if (flow)
        sections.push({
          title: year,
          rows: [
            { label: 'Купівлі', value: money(flow.purchases) },
            { label: 'Купони', value: money(flow.coupons) },
            { label: 'Погашення', value: money(flow.redemptions) },
            { label: 'Продажі', value: money(flow.sales) },
            { label: 'Дохід', value: flow.income === null ? '—' : money(flow.income) },
          ],
        });
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
    const money = (amount: number) => formatMoney(amount, currency);
    if (mode === 'yield') return yieldReportSections(currency, positions, keyRate, rateOn);
    const active = positions.filter((item) => item.bond && item.bond.maturityDate >= wallet.today);
    const values = active
      .map((item) => {
        const bond = item.bond!;
        const nominalOn = (date: string) =>
          bond.nominal -
          bond.payments
            .filter((payment) => payment.type === 'redemption' && payment.date <= date)
            .reduce((sum, payment) => sum + payment.amount, 0);
        const operations =
          purchases === 'made'
            ? item.position.operations.filter((operation) => !operation.planned)
            : item.position.operations;
        const cost = purchaseLots(operations).reduce((sum, lot) => {
          const originalNominal = nominalOn(lot.purchase.date);
          const remainingNominal = Math.min(originalNominal, Math.max(0, nominalOn(wallet.today)));
          return (
            sum +
            (originalNominal > 0
              ? (((lot.purchase.amount * lot.remaining) / lot.purchase.quantity) *
                  Math.max(0, remainingNominal)) /
                originalNominal
              : 0)
          );
        }, 0);
        return { item, cost: round2(cost) };
      })
      .filter((entry) => entry.cost > 0);
    const total = round2(values.reduce((sum, entry) => sum + entry.cost, 0));
    if (!values.length) return [];
    const averageRate = round2(
      values.reduce((sum, { item, cost }) => sum + item.bond!.rate * cost, 0) / total,
    );
    const averageDays = Math.round(
      values.reduce(
        (sum, { item, cost }) => sum + daysBetween(wallet.today, item.bond!.maturityDate) * cost,
        0,
      ) / total,
    );
    const buckets = [
      { label: 'До 6 місяців', months: 6 },
      { label: 'До 1 року', months: 12 },
      { label: 'До 2 років', months: 24 },
      { label: 'До 3 років', months: 36 },
      { label: 'Понад 3 роки', months: Infinity },
    ];
    const bucketRows = buckets.flatMap((bucket, index) => {
      const previous = index > 0 ? buckets[index - 1].months : 0;
      const amount = round2(
        values
          .filter(({ item }) => {
            const maturity = item.bond!.maturityDate;
            return (
              (index === 0 || maturity > addMonthsISO(wallet.today, previous)) &&
              (bucket.months === Infinity || maturity <= addMonthsISO(wallet.today, bucket.months))
            );
          })
          .reduce((sum, item) => sum + item.cost, 0),
      );
      return [
        { label: bucket.label, value: money(amount) },
        {
          label: `Частка · ${bucket.label}`,
          value: formatPercent(round2((amount / total) * 100)),
        },
      ];
    });
    return [
      {
        title: `Структура · ${currency}`,
        chart: {
          title: 'Частки за облігаціями',
          currency,
          bars: [...values]
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 5)
            .map(({ item, cost }) => ({ label: item.position.isin, value: cost })),
        },
        rows: [
          { label: 'Вартість утримуваних облігацій', value: money(total) },
          { label: 'Середня ставка купону', value: formatPercent(averageRate) },
          {
            label: 'Середня дата погашення',
            value: formatDate(addDaysISO(wallet.today, averageDays)),
          },
          ...bucketRows,
          ...values
            .sort((a, b) => b.cost - a.cost)
            .flatMap(({ item, cost }) => [
              { label: item.position.isin, value: money(cost) },
              {
                label: `Частка · ${item.position.isin}`,
                value: formatPercent(round2((cost / total) * 100)),
              },
            ]),
        ],
        footer: `Собівартість решти облігацій після продажів. Без даних облігації: ${positions.filter((item) => !item.bond).length}.`,
      },
    ];
  });
}
