import type { Currency } from './portfolio';

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
  /** The coupon goal the plan was made for, kept with it as «План з ціллю» */
  goal?: CouponGoal;
};

/** «Ціль: купони на місяць»: coupons wanted in every month of a year, bought in the year before. */
export type CouponGoal = {
  currency: Currency;
  /** «Рік купонів» */
  year: number;
  /** Coupons wanted in each month of the year */
  monthly: number;
};
