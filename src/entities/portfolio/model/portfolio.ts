/** Government bonds (ОВДП) and portfolio calculations. */

import { addMonthsISO, round2 } from '@/shared/lib';

/** Currencies of the NBU bonds, in the order the schedule lists them. */
export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_NAMES: Record<Currency, string> = {
  UAH: 'Гривня',
  USD: 'Долар',
  EUR: 'Євро',
};

export type PaymentType = 'coupon' | 'redemption';

export type BondPayment = {
  /** ISO date, YYYY-MM-DD */
  date: string;
  type: PaymentType;
  /** Amount paid per one bond, in the bond currency */
  amount: number;
};

export type Bond = {
  isin: string;
  nominal: number;
  /** Annual coupon rate, % */
  rate: number;
  currency: Currency;
  issueDate: string;
  maturityDate: string;
  description: string;
  payments: BondPayment[];
};

/** One purchase. Several purchases of the same ISIN form a position. */
export type Purchase = {
  id: string;
  isin: string;
  purchaseDate: string;
  /** Total amount paid for the bonds, in the bond currency */
  amount: number;
  quantity: number;
  /** The bond's currency, taken when the purchase is added */
  currency: Currency;
};

/** A purchase in one investment plan; the wallet shows those of the active plan. */
export type PlanPurchase = Purchase & { planId: string };

/** All purchases of one ISIN. */
export type Position = {
  isin: string;
  /** Sorted by purchase date */
  purchases: Purchase[];
  quantity: number;
  investedAmount: number;
};

export type PositionPayment = BondPayment & {
  isin: string;
  currency: Currency;
  /** Bonds held on the payment date */
  quantity: number;
  /** Per-bond amount × quantity */
  total: number;
  isPaid: boolean;
};

/** A purchase on the payment schedule: money paid for bonds, on the purchase date. */
export type PurchaseEvent = {
  type: 'purchase';
  /** Id of the purchase */
  id: string;
  date: string;
  isin: string;
  currency: Currency;
  quantity: number;
  /** Amount paid */
  total: number;
  /** Bought more of an ISIN already held */
  isTopUp: boolean;
};

/** What the schedule lists: payments received and purchases made. */
export type ScheduleEvent = PositionPayment | PurchaseEvent;

/**
 * Bonds to pick a purchase from. Without a query: those that can still be bought today. With one:
 * every bond whose ISIN contains it, so a past purchase of a redeemed bond can be added too. Those
 * that can still be bought first, then by maturity.
 */
export function bondChoices(bonds: Bond[], query: string, today: string): Bond[] {
  const normalizedQuery = query.replace(/\s+/g, '').toUpperCase();
  return bonds
    .filter((bond) =>
      normalizedQuery ? bond.isin.includes(normalizedQuery) : canBuyOn(bond, today),
    )
    .sort((first, second) => {
      const firstActive = canBuyOn(first, today);
      const secondActive = canBuyOn(second, today);
      if (firstActive !== secondActive) return firstActive ? -1 : 1;
      return first.maturityDate.localeCompare(second.maturityDate);
    });
}

/** Groups purchases by ISIN, keeping the order in which each ISIN was first added. */
export function groupPositions(purchases: Purchase[]): Position[] {
  const byIsin = new Map<string, Purchase[]>();
  for (const purchase of purchases) {
    byIsin.set(purchase.isin, [...(byIsin.get(purchase.isin) ?? []), purchase]);
  }
  return [...byIsin].map(([isin, isinPurchases]) => ({
    isin,
    purchases: isinPurchases.sort((first, second) =>
      first.purchaseDate.localeCompare(second.purchaseDate),
    ),
    quantity: isinPurchases.reduce((total, purchase) => total + purchase.quantity, 0),
    investedAmount: round2(isinPurchases.reduce((total, purchase) => total + purchase.amount, 0)),
  }));
}

/** A purchase dated after today. It counts as made once its date arrives, with no confirmation. */
export function isPlannedPurchase(
  purchase: Pick<Purchase, 'purchaseDate'>,
  today: string,
): boolean {
  return purchase.purchaseDate > today;
}

/**
 * Redeemed once the maturity date has passed: on the day itself the redemption is still to come,
 * as any payment is. It holds even while NBU has not published the redemption.
 */
export function isRedeemed(bond: Pick<Bond, 'maturityDate'>, today: string): boolean {
  return bond.maturityDate < today;
}

/**
 * A purchase can still be dated `date`: only before the maturity date. On that day the bond is
 * still in circulation, but its last payments go to the previous owner, so nothing is left to earn.
 */
export function canBuyOn(bond: Pick<Bond, 'maturityDate'>, date: string): boolean {
  return date < bond.maturityDate;
}

/** The bond matures within `months` of `date`, the last day included. */
export function maturesWithin(
  bond: Pick<Bond, 'maturityDate'>,
  date: string,
  months: number,
): boolean {
  return bond.maturityDate <= addMonthsISO(date, months);
}

/** What one bond cost: the amount paid for the purchase (or the position) ÷ quantity. */
export function pricePerBond(amount: number, quantity: number): number {
  return round2(amount / quantity);
}

/** The bond's currency from the NBU data; the purchase keeps its own for a bond missing there. */
export function purchaseCurrency(purchase: Purchase, bond?: Bond): Currency {
  return bond?.currency ?? purchase.currency;
}

/** Every purchase of a position is of one bond, so of one currency. */
export function positionCurrency(position: Position, bond?: Bond): Currency {
  return purchaseCurrency(position.purchases[0], bond);
}

/**
 * Payments the holder is entitled to. Each payment counts only the bonds bought before its date:
 * a payment on the purchase day itself goes to the previous owner (the register closes before it),
 * so a top-up starts earning from the next payment.
 */
export function positionPayments(
  purchases: Purchase[],
  bond: Bond,
  today: string,
): PositionPayment[] {
  return bond.payments.flatMap((payment) => {
    const quantity = purchases
      .filter((purchase) => purchase.purchaseDate < payment.date)
      .reduce((total, purchase) => total + purchase.quantity, 0);
    if (quantity === 0) return [];
    return [
      {
        ...payment,
        isin: bond.isin,
        currency: bond.currency,
        quantity,
        total: round2(payment.amount * quantity),
        isPaid: payment.date < today,
      },
    ];
  });
}

/** Every purchase in the wallet, by date, including purchases with an unknown currency. */
export function purchaseEvents(purchases: Purchase[], byIsin: Map<string, Bond>): PurchaseEvent[] {
  return groupPositions(purchases)
    .flatMap((position) =>
      position.purchases.map((purchase, index): PurchaseEvent => ({
        type: 'purchase',
        id: purchase.id,
        date: purchase.purchaseDate,
        isin: purchase.isin,
        currency: purchaseCurrency(purchase, byIsin.get(purchase.isin)),
        quantity: purchase.quantity,
        total: purchase.amount,
        isTopUp: index > 0,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Schedule order: by date, and on the same day a payment before a purchase, as the payment goes to
 * the previous owner.
 */
export function compareScheduleEvents(a: ScheduleEvent, b: ScheduleEvent): number {
  return (
    a.date.localeCompare(b.date) || Number(a.type === 'purchase') - Number(b.type === 'purchase')
  );
}

/** Sum of the events' totals, rounded to cents. */
export function sumTotals(events: { total: number }[]): number {
  return round2(events.reduce((total, event) => total + event.total, 0));
}

export function nextPayment(payments: PositionPayment[]): PositionPayment | undefined {
  return payments.find((payment) => !payment.isPaid);
}
