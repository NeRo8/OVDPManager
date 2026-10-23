/** Government bonds (ОВДП) and portfolio calculations. */

import { round2 } from '@/shared/lib';

/** Currencies of the NBU bonds, in the order the schedule lists them. */
export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

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
  /** Older purchases may lack this; the NBU bond can still supply it. */
  currency?: Currency;
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
  /** Unknown when neither the purchase nor NBU data supplies it. */
  currency: Currency | null;
  quantity: number;
  /** Amount paid */
  total: number;
  /** Bought more of an ISIN already held */
  isTopUp: boolean;
};

/** What the schedule lists: payments received and purchases made. */
export type ScheduleEvent = PositionPayment | PurchaseEvent;

/**
 * Bonds to pick a purchase from. Without a query: those still in circulation. With one: every bond
 * whose ISIN contains it, so a past purchase of a redeemed bond can be added too. Active bonds
 * first, then by maturity.
 */
export function bondChoices(bonds: Bond[], query: string, today: string): Bond[] {
  const normalizedQuery = query.replace(/\s+/g, '').toUpperCase();
  return bonds
    .filter((bond) =>
      normalizedQuery ? bond.isin.includes(normalizedQuery) : bond.maturityDate > today,
    )
    .sort((first, second) => {
      const firstActive = first.maturityDate >= today;
      const secondActive = second.maturityDate >= today;
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

/** Use the bond's currency when available, including for purchases saved before currency was stored. */
export function purchaseCurrency(purchase: Purchase, bond?: Bond): Currency | null {
  return bond?.currency ?? purchase.currency ?? null;
}

/** A position can have one currency only when every purchase's currency is known and agrees. */
export function positionCurrency(position: Position, bond?: Bond): Currency | null {
  const currency = purchaseCurrency(position.purchases[0], bond);
  return currency &&
    position.purchases.every((purchase) => purchaseCurrency(purchase, bond) === currency)
    ? currency
    : null;
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

/** Sum of the events' totals, rounded to cents. */
export function sumTotals(events: { total: number }[]): number {
  return round2(events.reduce((total, event) => total + event.total, 0));
}

export function nextPayment(payments: PositionPayment[]): PositionPayment | undefined {
  return payments.find((payment) => !payment.isPaid);
}
