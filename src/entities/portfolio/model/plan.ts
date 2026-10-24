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
