import { round2 } from '@/shared/lib';
import {
  CURRENCIES,
  type Bond,
  type Currency,
  type PositionPayment,
  type Purchase,
  type PurchaseEvent,
  positionPayments,
  purchaseEvents,
  sumTotals,
} from './portfolio';

/**
 * The plan that older backups restore into: their flat list of planned purchases and their wallet
 * purchases, which had no plan.
 */
export const LEGACY_PLAN_ID = 'original-plan';
export const LEGACY_PLAN_NAME = 'Мій план';

/** A proposed purchase. The price is an estimate entered by the user, not a market quote. */
export type PlannedPurchase = {
  id: string;
  isin: string;
  currency: Currency;
  date: string;
  quantity: number;
  pricePerBond: number;
};

/** An independent investment scenario with its own bonds and cash-flow forecast. */
export type InvestmentPlan = {
  id: string;
  name: string;
  items: PlannedPurchase[];
};

export type PlanTotals = {
  currency: Currency;
  /** False when NBU has not published a redemption row for one of the bonds. */
  complete: boolean;
  invested: number;
  coupons: number;
  redemption: number;
  proceeds: number;
  profit: number;
  returnPercent: number;
};

export function plannedAmount(purchase: PlannedPurchase): number {
  return round2(purchase.quantity * purchase.pricePerBond);
}

/** Only future, still possible purchases contribute to the forecast. */
export function projectPlan(planned: PlannedPurchase[], byIsin: Map<string, Bond>, today: string) {
  const valid = planned.filter((item) => {
    const bond = byIsin.get(item.isin);
    return (
      bond && item.date >= today && item.date >= bond.issueDate && item.date < bond.maturityDate
    );
  });
  const purchases: Purchase[] = valid.map((item) => ({
    id: item.id,
    isin: item.isin,
    purchaseDate: item.date,
    amount: plannedAmount(item),
    quantity: item.quantity,
    currency: byIsin.get(item.isin)!.currency,
  }));
  const byBond = new Map<string, Purchase[]>();
  for (const purchase of purchases) {
    byBond.set(purchase.isin, [...(byBond.get(purchase.isin) ?? []), purchase]);
  }
  const payments: PositionPayment[] = [...byBond].flatMap(([isin, items]) =>
    positionPayments(items, byIsin.get(isin)!, today),
  );
  const investments: PurchaseEvent[] = purchaseEvents(purchases, byIsin);
  const totals: PlanTotals[] = CURRENCIES.flatMap((currency) => {
    const invested = sumTotals(investments.filter((item) => item.currency === currency));
    if (!invested) return [];
    const coupons = sumTotals(
      payments.filter((item) => item.currency === currency && item.type === 'coupon'),
    );
    const redemption = sumTotals(
      payments.filter((item) => item.currency === currency && item.type === 'redemption'),
    );
    const complete = valid
      .filter((item) => byIsin.get(item.isin)?.currency === currency)
      .every((item) =>
        byIsin
          .get(item.isin)!
          .payments.some((payment) => payment.type === 'redemption' && payment.date > item.date),
      );
    const proceeds = round2(coupons + redemption);
    const profit = round2(proceeds - invested);
    return [
      {
        currency,
        complete,
        invested,
        coupons,
        redemption,
        proceeds,
        profit,
        returnPercent: round2((profit / invested) * 100),
      },
    ];
  });
  return {
    investments,
    payments: payments.sort((a, b) => a.date.localeCompare(b.date)),
    totals,
    excluded: planned.length - valid.length,
  };
}
