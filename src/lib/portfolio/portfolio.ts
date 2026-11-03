/** Government bonds (ОВДП) and portfolio calculations. */

import { addMonthsISO, formatDate } from '@/utils/date';
import { currencySign } from '@/utils/format';
import { round2 } from '@/utils/number';

import { compareOperations, purchaseLots, signedQuantity } from './operations';

/** Currencies of the NBU bonds, in the order the schedule lists them. */
export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_NAMES: Record<Currency, string> = {
  UAH: 'Гривня',
  USD: 'Долар',
  EUR: 'Євро',
};

/** The currency as a choice reads: its sign and name, «₴ Гривня» */
export function currencyTitle(currency: Currency): string {
  return `${currencySign(currency)} ${CURRENCY_NAMES[currency]}`;
}

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

/** A purchase or sale with the terms needed to retain its history without NBU. */
export type Operation = {
  type: 'purchase' | 'sale';
  /** Null only for legacy purchases whose bond data could not be recovered. */
  ovdp: Bond | null;
  id: string;
  isin: string;
  date: string;
  /** Full debit including fees, or net sale proceeds, in the bond currency */
  amount: number;
  quantity: number;
  /** The bond's currency, taken when the purchase is added */
  currency: Currency;
};

/** A purchase in one investment plan; the wallet shows those of the active plan. */
export type PlanOperation = Operation & { planId: string };

/** All operations of one ISIN. */
export type Position = {
  isin: string;
  /** Sorted by purchase date */
  operations: Operation[];
  quantity: number;
  investedAmount: number;
};

export type PositionPayment = BondPayment & {
  isin: string;
  currency: Currency;
  /** Bonds held on the payment date */
  quantity: number;
  /** Of `quantity`, the bonds of operations still planned (dated after today) */
  plannedQuantity: number;
  /** Per-bond amount × quantity */
  total: number;
  isPaid: boolean;
};

/** A purchase on the payment schedule: money paid for bonds, on the purchase date. */
export type OperationEvent = {
  type: 'purchase' | 'sale';
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

/** What the schedule lists: payments received and operations made. */
export type ScheduleEvent = PositionPayment | OperationEvent;

/**
 * Bonds to pick a purchase from. Without a query: those that can still be bought today. With one:
 * bonds matching its ISIN, maturity date or coupon rate with a percent sign, including redeemed
 * bonds so a past purchase can be added. Those that can still be bought first, then by maturity.
 */
export function bondChoices(bonds: Bond[], query: string, today: string): Bond[] {
  const normalizedQuery = query.replace(/\s+/g, '').toUpperCase();
  const rateQuery = /^(\d+(?:[.,]\d+)?)%$/.exec(normalizedQuery);
  return bonds
    .filter((bond) =>
      normalizedQuery
        ? bond.isin.includes(normalizedQuery) ||
          formatDate(bond.maturityDate).includes(normalizedQuery) ||
          bond.maturityDate.includes(normalizedQuery) ||
          (rateQuery !== null && bond.rate === Number(rateQuery[1].replace(',', '.')))
        : canBuyOn(bond, today),
    )
    .sort((first, second) => {
      const firstActive = canBuyOn(first, today);
      const secondActive = canBuyOn(second, today);
      if (firstActive !== secondActive) return firstActive ? -1 : 1;
      return first.maturityDate.localeCompare(second.maturityDate);
    });
}

/** Groups operations by ISIN, keeping the order in which each ISIN was first added. */
export function groupPositions(operations: Operation[]): Position[] {
  const byIsin = new Map<string, Operation[]>();
  for (const purchase of operations) {
    byIsin.set(purchase.isin, [...(byIsin.get(purchase.isin) ?? []), purchase]);
  }
  return [...byIsin].map(([isin, isinPurchases]) => ({
    isin,
    operations: isinPurchases.sort(compareOperations),
    quantity: isinPurchases.reduce((total, purchase) => total + signedQuantity(purchase), 0),
    investedAmount: round2(
      isinPurchases
        .filter((operation) => operation.type === 'purchase')
        .reduce((total, purchase) => total + purchase.amount, 0),
    ),
  }));
}

/** A purchase dated after today. It counts as made once its date arrives, with no confirmation. */
export function isPlannedPurchase(
  purchase: Pick<Operation, 'date'> & Partial<Pick<Operation, 'type'>>,
  today: string,
): boolean {
  return purchase.type !== 'sale' && purchase.date > today;
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
export function pricePerBond(amount: number, quantity: number): number | null {
  return quantity > 0 ? round2(amount / quantity) : null;
}

/** Operation currency is part of its history and does not depend on the live catalog. */
export function purchaseCurrency(purchase: Operation, _bond?: Bond): Currency {
  return purchase.currency;
}

/** Every purchase of a position is of one bond, so of one currency. */
export function positionCurrency(position: Position, bond?: Bond): Currency {
  return purchaseCurrency(position.operations[0], bond);
}

/**
 * Payments the holder is entitled to. Each payment counts only the bonds bought before its date:
 * a payment on the purchase day itself goes to the previous owner (the register closes before it),
 * so a top-up starts earning from the next payment.
 */
export function positionPayments(
  operations: Operation[],
  bond: Bond,
  today: string,
): PositionPayment[] {
  return bond.payments.flatMap((payment) => {
    const entitled = purchaseLots(operations.filter((operation) => operation.date < payment.date));
    const quantity = entitled.reduce((total, lot) => total + lot.remaining, 0);
    if (quantity === 0) return [];
    return [
      {
        ...payment,
        isin: bond.isin,
        currency: bond.currency,
        quantity,
        plannedQuantity: entitled
          .filter((lot) => isPlannedPurchase(lot.purchase, today))
          .reduce((total, lot) => total + lot.remaining, 0),
        total: round2(payment.amount * quantity),
        isPaid: payment.date < today,
      },
    ];
  });
}

/** Every purchase in the wallet, by date, including operations with an unknown currency. */
export function operationEvents(
  operations: Operation[],
  byIsin: Map<string, Bond>,
): OperationEvent[] {
  return groupPositions(operations)
    .flatMap((position) =>
      position.operations.map((purchase, index): OperationEvent => ({
        type: purchase.type,
        id: purchase.id,
        date: purchase.date,
        isin: purchase.isin,
        currency: purchaseCurrency(purchase, byIsin.get(purchase.isin)),
        quantity: purchase.quantity,
        total: purchase.amount,
        isTopUp:
          purchase.type === 'purchase' &&
          position.operations.slice(0, index).some((operation) => operation.type === 'purchase'),
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
    a.date.localeCompare(b.date) ||
    Number(a.type === 'purchase' || a.type === 'sale') -
      Number(b.type === 'purchase' || b.type === 'sale')
  );
}

/** Sum of the events' totals, rounded to cents. */
export function sumTotals(events: { total: number }[]): number {
  return round2(events.reduce((total, event) => total + event.total, 0));
}

export function nextPayment(payments: PositionPayment[]): PositionPayment | undefined {
  return payments.find((payment) => !payment.isPaid);
}
