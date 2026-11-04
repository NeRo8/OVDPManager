import type { CouponGoal } from '@/lib/portfolio/plan';
import { addDaysISO, addMonthsISO } from '@/utils/date';

/** How many years ahead «Роки купонів» can start. */
const GOAL_YEARS_AHEAD = 5;
/** The most «Роки купонів» a goal can span. */
export const MAX_INCOME_YEARS = 5;
/** The most «Роки купівель» a goal can buy in. */
export const MAX_PURCHASE_YEARS = 3;

type Span = { from: string; to: string };

/** The first year a purchase can still be dated in: tomorrow's. */
export const firstPurchaseYear = (today: string) => Number(addDaysISO(today, 1).slice(0, 4));

/**
 * The selected purchase years, from tomorrow at the earliest. Older goals end the year before
 * coupons start; newer goals can leave a gap between the periods.
 */
export function goalPurchaseSpan(
  goal: Pick<CouponGoal, 'year' | 'purchaseYears' | 'purchaseEndYear'>,
  today: string,
): Span {
  const endYear = goal.purchaseEndYear ?? goal.year - 1;
  const start = `${endYear - goal.purchaseYears + 1}-01-01`;
  const tomorrow = addDaysISO(today, 1);
  return { from: tomorrow > start ? tomorrow : start, to: `${endYear}-12-31` };
}

/** The years «Роки купонів» can start in: those with some days left to buy in the year before. */
export function goalYears(today: string): number[] {
  const first = firstPurchaseYear(today) + 1;
  const last = Number(today.slice(0, 4)) + GOAL_YEARS_AHEAD;
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
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
