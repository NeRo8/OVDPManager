import { round2 } from '@/shared/lib';
import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type PurchaseEvent,
  sumTotals,
} from './portfolio';
import type { WalletPosition } from './useWallet.hook';

/** The suggested name of the first plan. */
export const DEFAULT_PLAN_NAME = 'Мій план';
export const PLAN_NAME_MAX_LENGTH = 80;

/**
 * An investment plan: the basis of the app. Its purchases (past or planned) are the wallet
 * purchases with its id; the wallet and the payments show the active plan.
 */
export type InvestmentPlan = {
  id: string;
  name: string;
};

export type PlanTotals = {
  currency: Currency;
  /** False when NBU has not published a redemption row for one of the bonds. */
  complete: boolean;
  invested: number;
  coupons: number;
  redemption: number;
  totalPayments: number;
  netIncome: number;
  returnPercent: number;
};

/**
 * What the whole plan costs and earns, per currency: every purchase against every payment it is
 * entitled to, received or still ahead. Bonds missing from the NBU data have no payments and are
 * left out of the totals.
 */
export function planTotals(
  positions: WalletPosition[],
  payments: PositionPayment[],
  purchases: PurchaseEvent[],
): PlanTotals[] {
  return CURRENCIES.flatMap((currency) => {
    const known = positions.filter((item) => item.bond && item.currency === currency);
    if (!known.length) return [];
    const knownIsins = new Set(known.map((item) => item.position.isin));
    const invested = sumTotals(
      purchases.filter((item) => item.currency === currency && knownIsins.has(item.isin)),
    );
    const coupons = sumTotals(
      payments.filter((item) => item.currency === currency && item.type === 'coupon'),
    );
    const redemption = sumTotals(
      payments.filter((item) => item.currency === currency && item.type === 'redemption'),
    );
    const complete = known.every(
      ({ bond }) => !!bond?.payments.some((payment) => payment.type === 'redemption'),
    );
    const totalPayments = round2(coupons + redemption);
    const netIncome = round2(totalPayments - invested);
    return [
      {
        currency,
        complete,
        invested,
        coupons,
        redemption,
        totalPayments,
        netIncome,
        returnPercent: invested ? round2((netIncome / invested) * 100) : 0,
      },
    ];
  });
}
