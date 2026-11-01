import type { InvestmentPlan } from '../plan';
import { getInvestmentPlans, useInvestmentPlans } from '../plans';
import type { PlanPurchase } from '../portfolio';
import { getPurchases, usePurchases } from '../purchases';

function activeOf(plans: InvestmentPlan[]): InvestmentPlan | undefined {
  return plans.find((plan) => plan.isActive) ?? plans[0];
}

/** The plan whose wallet the app shows. */
export function useActivePlan(): InvestmentPlan | undefined {
  const plans = useInvestmentPlans();
  return activeOf(plans);
}

export function getActivePlan(): InvestmentPlan | undefined {
  return activeOf(getInvestmentPlans());
}

/** The active plan and its purchases, the wallet's. */
export function useActivePurchases(): { plan?: InvestmentPlan; purchases: PlanPurchase[] } {
  const plan = useActivePlan();
  const purchases = usePurchases().filter((purchase) => purchase.planId === plan?.id);
  return { plan, purchases };
}

/** The active plan's purchases, read once: for code outside rendering. */
export function getActivePurchases(): PlanPurchase[] {
  const plan = getActivePlan();
  return getPurchases().filter((purchase) => purchase.planId === plan?.id);
}
