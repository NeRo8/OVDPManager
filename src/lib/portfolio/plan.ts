import type { BondKind, Currency } from './portfolio';

/** A target for coupon income in every month of the selected years. */
export type CouponGoal = {
  kind?: BondKind | 'all';
  currency: Currency;
  year: number;
  incomeYears: number;
  /** Last purchase year; absent in goals made before custom purchase periods. */
  purchaseEndYear?: number;
  purchaseYears: number;
  monthly: number;
  reinvest: boolean;
};

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
 * An investment plan: the basis of the app. Its operations (past or planned) are the wallet
 * operations with its id; the wallet and the payments show the active plan.
 */
export type InvestmentPlan = {
  id: string;
  name: string;
  /** Whether this plan's wallet is currently shown. */
  isActive: boolean;
  goal?: CouponGoal;
};
