import { round2 } from '@/shared/lib';
import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type PurchaseEvent,
  sumTotals,
} from './portfolio';
import type { WalletPosition } from './useWallet.hook';

/**
 * The plan that older backups restore into: their wallet purchases, which had no plan, and their
 * flat list of planned purchases.
 */
export const LEGACY_PLAN_ID = 'original-plan';
export const LEGACY_PLAN_NAME = 'Мій план';

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
  proceeds: number;
  profit: number;
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
  investments: PurchaseEvent[],
): PlanTotals[] {
  return CURRENCIES.flatMap((currency) => {
    const known = positions.filter((item) => item.bond && item.currency === currency);
    if (!known.length) return [];
    const knownIsins = new Set(known.map((item) => item.position.isin));
    const invested = sumTotals(
      investments.filter((item) => item.currency === currency && knownIsins.has(item.isin)),
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
        returnPercent: invested ? round2((profit / invested) * 100) : 0,
      },
    ];
  });
}
