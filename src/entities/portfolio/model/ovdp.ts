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

/** One purchase (lot). Several purchases of the same ISIN form a position. */
export type Holding = {
  id: string;
  isin: string;
  purchaseDate: string;
  /** Total amount paid for the bonds, in the bond currency */
  amount: number;
  quantity: number;
};

/** All purchases of one ISIN. */
export type Position = {
  isin: string;
  /** Sorted by purchase date */
  lots: Holding[];
  quantity: number;
  amount: number;
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
  /** Id of the purchase (holding) */
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

/** Bonds whose ISIN contains the query; active bonds first, then by maturity. */
export function searchBonds(bonds: Bond[], query: string, today: string, limit = 20): Bond[] {
  const q = query.replace(/\s+/g, '').toUpperCase();
  if (!q) return [];
  return bonds
    .filter((b) => b.isin.includes(q))
    .sort((a, b) => {
      const aActive = a.maturityDate >= today;
      const bActive = b.maturityDate >= today;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.maturityDate.localeCompare(b.maturityDate);
    })
    .slice(0, limit);
}

/** Groups purchases by ISIN, keeping the order in which each ISIN was first added. */
export function groupPositions(holdings: Holding[]): Position[] {
  const byIsin = new Map<string, Holding[]>();
  for (const holding of holdings) {
    byIsin.set(holding.isin, [...(byIsin.get(holding.isin) ?? []), holding]);
  }
  return [...byIsin].map(([isin, lots]) => ({
    isin,
    lots: lots.sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate)),
    quantity: lots.reduce((sum, lot) => sum + lot.quantity, 0),
    amount: round2(lots.reduce((sum, lot) => sum + lot.amount, 0)),
  }));
}

/**
 * Payments the holder is entitled to. Each payment counts only the bonds bought before its date:
 * a payment on the purchase day itself goes to the previous owner (the register closes before it),
 * so a top-up starts earning from the next payment.
 */
export function positionPayments(lots: Holding[], bond: Bond, today: string): PositionPayment[] {
  return bond.payments.flatMap((p) => {
    const quantity = lots
      .filter((lot) => lot.purchaseDate < p.date)
      .reduce((sum, lot) => sum + lot.quantity, 0);
    if (quantity === 0) return [];
    return [
      {
        ...p,
        isin: bond.isin,
        currency: bond.currency,
        quantity,
        total: round2(p.amount * quantity),
        isPaid: p.date < today,
      },
    ];
  });
}

/** Every payment across the wallet, by date. Positions missing from the NBU data are skipped. */
export function portfolioPayments(
  holdings: Holding[],
  byIsin: Map<string, Bond>,
  today: string,
): PositionPayment[] {
  return groupPositions(holdings)
    .flatMap((position) => {
      const bond = byIsin.get(position.isin);
      return bond ? positionPayments(position.lots, bond, today) : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Every purchase in the wallet, by date. The currency comes from the NBU data, UAH if missing. */
export function purchaseEvents(holdings: Holding[], byIsin: Map<string, Bond>): PurchaseEvent[] {
  return groupPositions(holdings)
    .flatMap((position) =>
      position.lots.map((lot, index): PurchaseEvent => ({
        type: 'purchase',
        id: lot.id,
        date: lot.purchaseDate,
        isin: lot.isin,
        currency: byIsin.get(lot.isin)?.currency ?? 'UAH',
        quantity: lot.quantity,
        total: lot.amount,
        isTopUp: index > 0,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Sum of the events' totals, rounded to cents. */
export function sumTotals(payments: { total: number }[]): number {
  return round2(payments.reduce((sum, payment) => sum + payment.total, 0));
}

export function nextPayment(payments: PositionPayment[]): PositionPayment | undefined {
  return payments.find((p) => !p.isPaid);
}
