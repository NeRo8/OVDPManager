import {
  type Bond,
  type PositionPayment,
  groupPositions,
  plannedByDate,
  pricePerBond,
} from '@/lib/portfolio/portfolio';
import { walletPosition } from '@/lib/portfolio/position';

import type { PurchaseFormValues } from './purchaseForm.schema';
import { type PurchaseAssessment, annualYieldText, assessPurchase } from './purchaseHints';

/** What a valid purchase form says the purchase brings, and how good it is. */
export type PurchasePreview = PurchaseAssessment & {
  nextPayment?: PositionPayment;
  /** Coupons still to be paid to this purchase */
  couponsLeft: number;
  totalPayments: number;
  /** Null while NBU has not published the redemption */
  netIncome: number | null;
  returnPercent: number | null;
  /** «Річна дохідність» in words (`annualYieldText`) */
  annualYield: string;
};

type Input = {
  bond: Bond;
  values: PurchaseFormValues;
  today: string;
  /** NBU key policy rate on the purchase date, % a year; null until loaded */
  keyRate: number | null;
  /** The key rate is missing as NBU could not be asked for it */
  keyRateFailed: boolean;
  /** The whole NBU catalog, to find the bonds placed lately */
  bonds: Bond[];
};

/**
 * The purchase as a Position of one purchase, summed up as the wallet's are, with its assessment.
 * Null only without results, which a bond from the NBU data always has.
 */
export function purchasePreview({
  bond,
  values,
  today,
  keyRate,
  keyRateFailed,
  bonds,
}: Input): PurchasePreview | null {
  const draft = {
    type: 'purchase' as const,
    ovdp: bond,
    ...values,
    id: 'draft',
    isin: bond.isin,
    currency: bond.currency,
    planned: plannedByDate(values.date, today),
  };
  const position = groupPositions([draft])[0];
  const { results, payments, nextPayment, annualYield } = walletPosition(position, bond, today);
  const price = pricePerBond(values.amount, values.quantity);
  if (!results || price === null) return null;
  const yieldInput = { annualYield, netIncome: results.netIncome, isComplete: results.complete };
  return {
    ...assessPurchase({
      ...yieldInput,
      bond,
      date: values.date,
      today,
      pricePerBond: price,
      keyRate,
      keyRateFailed,
      bonds,
    }),
    nextPayment,
    couponsLeft: payments.filter((payment) => payment.type === 'coupon' && !payment.isPaid).length,
    totalPayments: results.totalPayments,
    netIncome: results.netIncome,
    returnPercent: results.returnPercent,
    annualYield: annualYieldText(yieldInput),
  };
}
