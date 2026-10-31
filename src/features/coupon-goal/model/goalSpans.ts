import { type CouponGoal } from '@/entities/portfolio';

import { addDaysISO, addMonthsISO } from '@/shared/lib';

/** How many years ahead «Роки купонів» can start. */
const GOAL_YEARS_AHEAD = 5;
/** The most «Роки купонів» a goal can span. */
const MAX_INCOME_YEARS = 5;
/** The most «Роки купівель» a goal can buy in. */
const MAX_PURCHASE_YEARS = 3;

/** The choices of «Роки купонів»: 1 to 5. */
export const GOAL_INCOME_YEARS = Array.from({ length: MAX_INCOME_YEARS }, (_, index) => index + 1);

type Span = { from: string; to: string };

/** The first year a purchase can still be dated in: tomorrow's. */
const firstPurchaseYear = (today: string) => Number(addDaysISO(today, 1).slice(0, 4));

/**
 * «Роки купівель»: the `purchaseYears` years right before the first of «Роки купонів», from
 * tomorrow at the earliest.
 */
export function goalPurchaseSpan(
  goal: Pick<CouponGoal, 'year' | 'purchaseYears'>,
  today: string,
): Span {
  const start = `${goal.year - goal.purchaseYears}-01-01`;
  const tomorrow = addDaysISO(today, 1);
  return { from: tomorrow > start ? tomorrow : start, to: `${goal.year - 1}-12-31` };
}

/** The years «Роки купонів» can start in: those with some days left to buy in the year before. */
export function goalYears(today: string): number[] {
  const first = firstPurchaseYear(today) + 1;
  const last = Number(today.slice(0, 4)) + GOAL_YEARS_AHEAD;
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

/**
 * The choices of «Роки купівель» before coupons from `year`: up to three, none starting in a year
 * that has no days left to buy in.
 */
export function goalPurchaseYears(year: number, today: string): number[] {
  const most = Math.min(MAX_PURCHASE_YEARS, year - firstPurchaseYear(today));
  return Array.from({ length: Math.max(0, most) }, (_, index) => index + 1);
}

/** `purchaseYears` cut to what is left to buy in before coupons from `year`. */
export function fitPurchaseYears(year: number, purchaseYears: number, today: string): number {
  return Math.max(1, Math.min(purchaseYears, goalPurchaseYears(year, today).length));
}

/** Where a date falls among the months of «Роки купонів», counted from 0; −1 outside them. */
export function goalMonthIndex(goal: Pick<CouponGoal, 'year' | 'incomeYears'>, date: string) {
  const index = (Number(date.slice(0, 4)) - goal.year) * 12 + Number(date.slice(5, 7)) - 1;
  return index >= 0 && index < goal.incomeYears * 12 ? index : -1;
}

/** The first day of each month of a span, the span's first day for its first month. */
export function monthStarts({ from, to }: Span): string[] {
  const starts: string[] = [];
  for (let start = `${from.slice(0, 7)}-01`; start <= to; start = addMonthsISO(start, 1)) {
    starts.push(start < from ? from : start);
  }
  return starts;
}
