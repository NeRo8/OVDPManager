import { CURRENCIES, type Currency } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { addMonthsISO, monthRange } from '@/utils/date';
import { round2 } from '@/utils/number';

export type CashFlowChart = {
  currency: Currency;
  periods: {
    label: string;
    purchases: number;
    planned: number;
    coupons: number;
    redemptions: number;
    sales: number;
  }[];
};

/** Monthly bars for a short span; years for longer periods, to keep labels readable. */
export function cashFlowCharts(wallet: Wallet, from: string, to: string): CashFlowChart[] {
  const months =
    (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
    Number(to.slice(5, 7)) -
    Number(from.slice(5, 7)) +
    1;
  const periods: { from: string; to: string; label: string }[] = [];
  if (months <= 18) {
    for (let month = `${from.slice(0, 7)}-01`; month <= to; month = addMonthsISO(month, 1)) {
      const end = monthRange(month).to;
      periods.push({
        from: month < from ? from : month,
        to: end > to ? to : end,
        label: month.slice(0, 7),
      });
    }
  } else {
    for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year++) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      periods.push({
        from: start < from ? from : start,
        to: end > to ? to : end,
        label: String(year),
      });
    }
  }
  return CURRENCIES.flatMap((currency): CashFlowChart[] => {
    const operations = wallet.operationEvents.filter(
      (event) => event.currency === currency && event.date >= from && event.date <= to,
    );
    const payments = wallet.payments.filter(
      (event) => event.currency === currency && event.date >= from && event.date <= to,
    );
    if (!operations.length && !payments.length) return [];
    const sum = (items: { total: number }[]) =>
      round2(items.reduce((total, item) => total + item.total, 0));
    return [
      {
        currency,
        periods: periods.map((period) => {
          const inRange = (event: { date: string }) =>
            event.date >= period.from && event.date <= period.to;
          const inOperations = operations.filter(inRange);
          const inPayments = payments.filter(inRange);
          return {
            label: period.label,
            purchases: sum(
              inOperations.filter((event) => event.type === 'purchase' && !event.planned),
            ),
            planned: sum(
              inOperations.filter((event) => event.type === 'purchase' && event.planned),
            ),
            coupons: sum(inPayments.filter((event) => event.type === 'coupon')),
            redemptions: sum(inPayments.filter((event) => event.type === 'redemption')),
            sales: sum(inOperations.filter((event) => event.type === 'sale')),
          };
        }),
      },
    ];
  });
}
