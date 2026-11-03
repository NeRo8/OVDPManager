import type { InvestmentPlan } from '@/lib/portfolio/plan';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import { getOperations, useOperations } from '@/stores/operations';

import { usePlansStore } from './store';

export function useInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore((state) => state.plans);
}

export function getInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore.getState().plans;
}

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

/** The active plan and its operations, the wallet's. */
export function useActiveOperations(): { plan?: InvestmentPlan; operations: PlanOperation[] } {
  const plan = useActivePlan();
  const operations = useOperations().filter((purchase) => purchase.planId === plan?.id);
  return { plan, operations };
}

/** The active plan's operations, read once: for code outside rendering. */
export function getActiveOperations(): PlanOperation[] {
  const plan = getActivePlan();
  return getOperations().filter((purchase) => purchase.planId === plan?.id);
}
