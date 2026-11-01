import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type PurchaseEvent,
  type Wallet,
  compareScheduleEvents,
  sumTotals,
} from '@/entities/portfolio';

import { monthRange, round2 } from '@/shared/lib';

/** «Найближчі купівлі» in one currency: what to buy until the end of next month, and the money. */
export type UpcomingPurchases = {
  currency: Currency;
  /** The last day they cover: the end of next month */
  through: string;
  /** Planned purchases by date */
  purchases: PurchaseEvent[];
  amount: number;
  /** The plan's coupons and redemptions still to come until `through`, today's included */
  planMoney: number;
  /**
   * The own money to have so that every purchase is paid for on its date: the plan's payments
   * count only for the purchases on or after their date
   */
  ownMoney: number;
};

/**
 * The deepest the plan's money falls going through the period by date, a payment before a
 * purchase on the same day (as the schedule orders them): what own money has to cover.
 */
function shortfall(payments: PositionPayment[], purchases: PurchaseEvent[]): number {
  let balance = 0;
  let lowest = 0;
  for (const event of [...payments, ...purchases].sort(compareScheduleEvents)) {
    balance += event.type === 'purchase' ? -event.total : event.total;
    lowest = Math.min(lowest, balance);
  }
  return round2(-lowest);
}

/** The active plan's planned purchases until the end of next month, per currency that has any. */
export function upcomingPurchases(wallet: Wallet): UpcomingPurchases[] {
  const { today } = wallet;
  const through = monthRange(today, 1).to;
  // A purchase dated today counts as made; a payment dated today is still to come.
  const plannedUntilThrough = (event: { date: string }) =>
    event.date > today && event.date <= through;

  return CURRENCIES.flatMap((currency): UpcomingPurchases[] => {
    const purchases = wallet.purchaseEvents.filter(
      (event) => event.currency === currency && plannedUntilThrough(event),
    );
    if (!purchases.length) return [];
    const payments = wallet.payments.filter(
      (payment) => payment.currency === currency && !payment.isPaid && payment.date <= through,
    );
    return [
      {
        currency,
        through,
        purchases,
        amount: sumTotals(purchases),
        planMoney: sumTotals(payments),
        ownMoney: shortfall(payments, purchases),
      },
    ];
  });
}
