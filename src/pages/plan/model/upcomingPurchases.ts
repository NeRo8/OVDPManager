import {
  CURRENCIES,
  type Currency,
  type PurchaseEvent,
  type Wallet,
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
  /** The plan's coupons and redemptions still ahead until `through` */
  planMoney: number;
  /** What the purchases need beyond the plan's money */
  ownMoney: number;
};

/** The active plan's planned purchases until the end of next month, per currency that has any. */
export function upcomingPurchases(wallet: Wallet): UpcomingPurchases[] {
  const { today } = wallet;
  const through = monthRange(today, 1).to;
  const ahead = (event: { date: string }) => event.date > today && event.date <= through;

  return CURRENCIES.flatMap((currency): UpcomingPurchases[] => {
    const purchases = wallet.purchaseEvents.filter(
      (event) => event.currency === currency && ahead(event),
    );
    if (!purchases.length) return [];
    const amount = sumTotals(purchases);
    const planMoney = sumTotals(
      wallet.payments.filter((payment) => payment.currency === currency && ahead(payment)),
    );
    return [
      {
        currency,
        through,
        purchases,
        amount,
        planMoney,
        ownMoney: Math.max(0, round2(amount - planMoney)),
      },
    ];
  });
}
