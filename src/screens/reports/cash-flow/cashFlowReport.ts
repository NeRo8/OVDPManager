import { purchaseLots } from '@/lib/portfolio/operations';
import { CURRENCIES, type Bond, type Currency, receivedAmount } from '@/lib/portfolio/portfolio';
import { resultsByCurrency, type WalletPosition } from '@/lib/portfolio/position';
import type { Wallet } from '@/lib/portfolio/wallet';
import { round2 } from '@/utils/number';

export type CashFlow = {
  currency: Currency;
  purchases: number;
  plannedPurchases: number;
  sales: number;
  coupons: number;
  redemptions: number;
  received: number;
  expected: number;
  balance: number;
  income: number | null;
  annualYield: number | null;
  withoutYieldCount: number;
};

function remainingNominal(bond: Bond, date: string): number {
  return (
    bond.nominal -
    bond.payments
      .filter((payment) => payment.type === 'redemption' && payment.date <= date)
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
}

/** Gain is the proceeds less the allocated purchase cost, plus coupons. */
function positionIncome(item: WalletPosition, from: string, to: string): number | null {
  const { bond, position, payments } = item;
  if (!bond) return null;
  const inRange = (date: string) => date >= from && date <= to;
  const lots = purchaseLots(position.operations);
  let income = payments
    .filter((p) => p.type === 'coupon' && inRange(p.date))
    .reduce((sum, p) => sum + p.total, 0);
  for (const { purchase, sales } of lots) {
    const nominal = remainingNominal(bond, purchase.date);
    if (nominal <= 0) return null;
    const unitCostPerNominal = purchase.amount / purchase.quantity / nominal;
    for (const sale of sales) {
      if (inRange(sale.date))
        income +=
          sale.total - sale.quantity * remainingNominal(bond, sale.date) * unitCostPerNominal;
    }
    for (const payment of bond.payments) {
      if (payment.type !== 'redemption' || !inRange(payment.date) || payment.date <= purchase.date)
        continue;
      const quantity =
        purchase.quantity -
        sales
          .filter((sale) => sale.date < payment.date)
          .reduce((sum, sale) => sum + sale.quantity, 0);
      income += quantity * payment.amount * (1 - unitCostPerNominal);
    }
  }
  return round2(income);
}

/** Flows in a date range, including planned operations; received excludes unconfirmed portions. */
export function cashFlowReport(wallet: Wallet, from: string, to: string): CashFlow[] {
  const inRange = (date: string) => date >= from && date <= to;
  return CURRENCIES.flatMap((currency): CashFlow[] => {
    const operations = wallet.operationEvents.filter(
      (event) => event.currency === currency && inRange(event.date),
    );
    const payments = wallet.payments.filter(
      (payment) => payment.currency === currency && inRange(payment.date),
    );
    if (!operations.length && !payments.length) return [];
    const total = (items: { total: number }[]) =>
      round2(items.reduce((sum, item) => sum + item.total, 0));
    const purchases = total(operations.filter((event) => event.type === 'purchase'));
    const plannedPurchases = total(
      operations.filter((event) => event.type === 'purchase' && event.planned),
    );
    const sales = total(operations.filter((event) => event.type === 'sale'));
    const coupons = total(payments.filter((payment) => payment.type === 'coupon'));
    const redemptions = total(payments.filter((payment) => payment.type === 'redemption'));
    const received = round2(
      payments.reduce((sum, payment) => sum + receivedAmount(payment), 0) +
        total(operations.filter((event) => event.type === 'sale' && !event.planned)),
    );
    const expected = round2(sales + coupons + redemptions - received);
    const involved = new Set([...operations, ...payments].map((event) => event.isin));
    const positions = wallet.positions.filter(
      (item) => item.currency === currency && involved.has(item.position.isin),
    );
    const incomes = positions.map((item) => positionIncome(item, from, to));
    return [
      {
        currency,
        purchases,
        plannedPurchases,
        sales,
        coupons,
        redemptions,
        received,
        expected,
        balance: round2(sales + coupons + redemptions - purchases),
        income: incomes.some((value) => value === null)
          ? null
          : round2(incomes.reduce<number>((sum, value) => sum + (value ?? 0), 0)),
        annualYield: resultsByCurrency(positions)[0]?.annualYield ?? null,
        withoutYieldCount: positions.filter((item) => item.annualYield === null).length,
      },
    ];
  });
}
