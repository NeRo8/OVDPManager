import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type OperationEvent,
  compareScheduleEvents,
  sumTotals,
} from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { monthRange } from '@/utils/date';
import { round2 } from '@/utils/number';

/** «Найближчі купівлі» in one currency: what to buy until the end of next month, and the money. */
export type UpcomingPurchases = {
  currency: Currency;
  /** The last day they cover: the end of next month */
  through: string;
  /** Planned purchases by date, those whose date has come first */
  operations: OperationEvent[];
  amount: number;
  /** The plan's coupons and redemptions still to come until `through`, today's included */
  planMoney: number;
  /**
   * The own money to have so that every purchase is paid for on its date: the plan's payments
   * count only for the operations on or after their date
   */
  ownMoney: number;
};

/**
 * The deepest the plan's money falls going through the period by date, a payment before a
 * purchase on the same day (as the schedule orders them): what own money has to cover.
 */
function shortfall(payments: PositionPayment[], operations: OperationEvent[]): number {
  let balance = 0;
  let lowest = 0;
  for (const event of [...payments, ...operations].sort(compareScheduleEvents)) {
    balance += event.type === 'purchase' ? -event.total : event.total;
    lowest = Math.min(lowest, balance);
  }
  return round2(-lowest);
}

/**
 * The active plan's planned purchases until the end of next month, the ones still waiting for a
 * confirmation included, per currency that has any.
 */
export function upcomingPurchases(wallet: Wallet): UpcomingPurchases[] {
  const { today } = wallet;
  const through = monthRange(today, 1).to;

  return CURRENCIES.flatMap((currency): UpcomingPurchases[] => {
    // Planned purchases until `through`, those whose date has come without a confirmation first
    // among them: they wait for the user to say whether they took place.
    const operations = wallet.operationEvents.filter(
      (event) =>
        event.type === 'purchase' &&
        event.currency === currency &&
        event.planned &&
        event.date <= through,
    );
    if (!operations.length) return [];
    const payments = wallet.payments.filter(
      (payment) => payment.currency === currency && !payment.isPaid && payment.date <= through,
    );
    return [
      {
        currency,
        through,
        operations,
        amount: sumTotals(operations),
        planMoney: sumTotals(payments),
        ownMoney: shortfall(payments, operations),
      },
    ];
  });
}
