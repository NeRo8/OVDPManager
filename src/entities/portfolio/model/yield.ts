import { daysBetween, round2 } from '@/shared/lib';

/**
 * The yields `annualYield` can find, % a year; beyond them it gives null. A rate of −200 % would
 * zero the half-year factor.
 */
export const ANNUAL_YIELD_RANGE = { lowest: -99, highest: 1000 } as const;

/** Bounds of the search, as fractions a year. */
const LOWEST_RATE = ANNUAL_YIELD_RANGE.lowest / 100;
const HIGHEST_RATE = ANNUAL_YIELD_RANGE.highest / 100;

/**
 * Annual yield of a purchase held to maturity, % a year: the rate at which its payments,
 * discounted back to the purchase date, add up to the amount paid. It accounts for the price and
 * for when each payment comes. It is quoted like the coupon rate, a year's rate paid in two
 * halves, so it compares directly with the coupon rate, the NBU key rate and deposit rates: a
 * purchase at the nominal on a coupon date yields the coupon rate. Null when there is nothing to compute or the
 * yield is outside −99…1000 %.
 */
export function annualYield(
  amount: number,
  purchaseDate: string,
  payments: { date: string; total: number }[],
): number | null {
  if (amount <= 0 || payments.length === 0) return null;
  const flows = payments.map((payment) => ({
    years: daysBetween(purchaseDate, payment.date) / 365,
    total: payment.total,
  }));
  const presentValue = (rate: number) =>
    flows.reduce((sum, flow) => sum + flow.total / (1 + rate / 2) ** (flow.years * 2), 0);
  if (presentValue(LOWEST_RATE) < amount || presentValue(HIGHEST_RATE) > amount) return null;

  // The present value falls as the rate grows, so halving the range closes in on the yield.
  let low = LOWEST_RATE;
  let high = HIGHEST_RATE;
  for (let step = 0; step < 100; step += 1) {
    const middle = (low + high) / 2;
    if (presentValue(middle) > amount) low = middle;
    else high = middle;
  }
  return round2(((low + high) / 2) * 100);
}
