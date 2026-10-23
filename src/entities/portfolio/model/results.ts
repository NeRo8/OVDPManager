import { round2 } from '@/shared/lib';
import {
  type Bond,
  CURRENCIES,
  type Currency,
  type Purchase,
  groupPositions,
  positionPayments,
  sumTotals,
} from './portfolio';

/** What purchases in one currency cost and earn, held to maturity. */
export type PurchaseResults = {
  currency: Currency;
  /** False while NBU has not published the redemption of one of the bonds: the payments fall short. */
  complete: boolean;
  invested: number;
  coupons: number;
  redemption: number;
  /** Payments already received */
  received: number;
  /** Payments still ahead */
  expected: number;
  /** Coupons plus redemption */
  totalPayments: number;
  /** Total payments minus invested; null while the payments are incomplete */
  netIncome: number | null;
  /** Net income as % of invested, for the whole term; null while the payments are incomplete */
  returnPercent: number | null;
};

/**
 * What purchases cost and earn, per currency: every purchase against every payment it is entitled
 * to, received or still ahead. Purchases of bonds missing from the NBU data have no payments and are
 * left out. A plan, one bond's position and a draft purchase are all summed up here.
 */
export function purchaseResults(
  purchases: Purchase[],
  byIsin: Map<string, Bond>,
  today: string,
): PurchaseResults[] {
  const known = groupPositions(purchases).flatMap((position) => {
    const bond = byIsin.get(position.isin);
    return bond
      ? [{ position, bond, payments: positionPayments(position.purchases, bond, today) }]
      : [];
  });
  return CURRENCIES.flatMap((currency) => {
    const positions = known.filter(({ bond }) => bond.currency === currency);
    if (!positions.length) return [];
    const payments = positions.flatMap((item) => item.payments);
    const invested = round2(
      positions.reduce((total, { position }) => total + position.investedAmount, 0),
    );
    const coupons = sumTotals(payments.filter((payment) => payment.type === 'coupon'));
    const redemption = sumTotals(payments.filter((payment) => payment.type === 'redemption'));
    const totalPayments = round2(coupons + redemption);
    const complete = positions.every(({ bond }) =>
      bond.payments.some((payment) => payment.type === 'redemption'),
    );
    const netIncome = complete ? round2(totalPayments - invested) : null;
    return [
      {
        currency,
        complete,
        invested,
        coupons,
        redemption,
        received: sumTotals(payments.filter((payment) => payment.isPaid)),
        expected: sumTotals(payments.filter((payment) => !payment.isPaid)),
        totalPayments,
        netIncome,
        returnPercent: netIncome !== null && invested ? round2((netIncome / invested) * 100) : null,
      },
    ];
  });
}
