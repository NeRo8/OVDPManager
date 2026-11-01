import type { Currency } from './portfolio';

/** The suggested name of the first plan. */
export const DEFAULT_PLAN_NAME = 'Мій план';
export const PLAN_NAME_MAX_LENGTH = 80;

/** Compare user-visible plan names without allowing invisible duplicates. */
export function samePlanName(first: string, second: string): boolean {
  return first.trim().toLocaleLowerCase('uk-UA') === second.trim().toLocaleLowerCase('uk-UA');
}

export function uniquePlanName(name: string, plans: { name: string }[]): string {
  const base = name.trim().slice(0, PLAN_NAME_MAX_LENGTH).trimEnd();
  if (!plans.some((plan) => samePlanName(plan.name, base))) return base;
  for (let index = 2; ; index += 1) {
    const suffix = ` (${index})`;
    const candidate = base.slice(0, PLAN_NAME_MAX_LENGTH - suffix.length).trimEnd() + suffix;
    if (!plans.some((plan) => samePlanName(plan.name, candidate))) return candidate;
  }
}

/**
 * An investment plan: the basis of the app. Its purchases (past or planned) are the wallet
 * purchases with its id; the wallet and the payments show the active plan.
 */
export type InvestmentPlan = {
  id: string;
  name: string;
  /** The coupon goal the plan was made for, kept with it as «План з ціллю» */
  goal?: CouponGoal;
};

/**
 * «Ціль: купони на місяць»: coupons wanted in every month of «Роки купонів», bought in «Роки
 * купівель» right before them.
 */
export type CouponGoal = {
  currency: Currency;
  /** The first of «Роки купонів» */
  year: number;
  /** How many «Роки купонів» there are, from `year` on */
  incomeYears: number;
  /** How many «Роки купівель» come right before `year` */
  purchaseYears: number;
  /** Coupons wanted in each month of «Роки купонів» */
  monthly: number;
  /** Whether the payments of «Роки купівель» pay for the purchases or are taken out */
  reinvest: boolean;
};

/** The last of a goal's «Роки купонів». */
export const goalLastYear = (goal: Pick<CouponGoal, 'year' | 'incomeYears'>): number =>
  goal.year + goal.incomeYears - 1;

/** «Роки купонів» as a name: «2029» or «2029–2031». */
export function goalYearsLabel(goal: Pick<CouponGoal, 'year' | 'incomeYears'>): string {
  const last = goalLastYear(goal);
  return last === goal.year ? String(goal.year) : `${goal.year}–${last}`;
}
