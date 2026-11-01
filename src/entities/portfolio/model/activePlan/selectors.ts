import type { InvestmentPlan } from '../plan';
import { getInvestmentPlans, useInvestmentPlans } from '../plans';

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
