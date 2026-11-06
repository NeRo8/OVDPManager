import { purchaseLots } from '@/lib/portfolio/operations';
import { receivedAmount } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { addMonthsISO, monthRange } from '@/utils/date';
import { round2 } from '@/utils/number';

export type FxEvent = {
  date: string;
  isin: string;
  type: 'purchase' | 'sale' | 'coupon' | 'redemption';
  amount: number;
};

/** Only confirmed UAH cash flows enter a historical currency comparison. */
export function fxEvents(wallet: Wallet): FxEvent[] {
  const operations = wallet.operationEvents
    .filter((event) => event.currency === 'UAH' && !event.planned && event.date <= wallet.today)
    .map((event) => ({
      date: event.date,
      isin: event.isin,
      type: event.type,
      amount: event.total,
    }));
  const payments = wallet.payments
    .filter((payment) => payment.currency === 'UAH' && payment.isPaid)
    .map((payment) => ({
      date: payment.date,
      isin: payment.isin,
      type: payment.type,
      amount: round2(receivedAmount(payment)),
    }))
    .filter((payment) => payment.amount > 0);
  return [...operations, ...payments].sort((a, b) => a.date.localeCompare(b.date));
}

export function convertFxEvents(events: FxEvent[], rates: Record<string, number>) {
  return events.map((event) => ({
    ...event,
    rate: rates[event.date],
    equivalent: round2(event.amount / rates[event.date]),
  }));
}

/** Purchase cost still held at the date, after confirmed sales and received redemptions. */
export function fxRemainingCost(wallet: Wallet, through: string): number | null {
  let total = 0;
  for (const item of wallet.positions.filter((position) => position.currency === 'UAH')) {
    const operations = item.position.operations.filter(
      (operation) => !operation.planned && operation.date <= through,
    );
    const lots = purchaseLots(operations).filter((lot) => lot.remaining > 0);
    if (!lots.length) continue;
    if (!item.bond) return null;
    const bond = item.bond;
    const nominalOn = (date: string) =>
      bond.nominal -
      bond.payments
        .filter(
          (payment) =>
            payment.type === 'redemption' && payment.date <= date && payment.date < wallet.today,
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
    for (const lot of lots) {
      const original = nominalOn(lot.purchase.date);
      if (original <= 0) return null;
      const remaining = Math.max(0, Math.min(original, nominalOn(through)));
      total +=
        (((lot.purchase.amount * lot.remaining) / lot.purchase.quantity) * remaining) / original;
    }
  }
  return round2(total);
}

/** End-of-period snapshots compare past spending with proceeds plus cost still held. */
export function fxTrend(
  wallet: Wallet,
  events: ReturnType<typeof convertFxEvents>,
  rates: Record<string, number>,
  through: string,
  period: 'all' | 'year',
) {
  if (!events.length) return [];
  const dates: string[] = [];
  const firstMonth =
    period === 'all' ? `${events[0].date.slice(0, 7)}-01` : `${through.slice(0, 4)}-01-01`;
  for (let month = firstMonth; month <= through; month = addMonthsISO(month, 1)) {
    const end = monthRange(month).to;
    dates.push(end < through ? end : through);
  }
  return dates.map((date) => {
    const before = events.filter((event) => event.date <= date);
    const invested = round2(
      before
        .filter((event) => event.type === 'purchase')
        .reduce((sum, event) => sum + event.equivalent, 0),
    );
    const received = round2(
      before
        .filter((event) => event.type !== 'purchase')
        .reduce((sum, event) => sum + event.equivalent, 0),
    );
    const remaining = fxRemainingCost(wallet, date);
    return {
      date,
      invested,
      value: remaining === null || !rates[date] ? null : round2(received + remaining / rates[date]),
    };
  });
}
