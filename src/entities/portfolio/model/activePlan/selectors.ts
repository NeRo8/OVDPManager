import type { InvestmentPlan } from '../plan';
import { getInvestmentPlans, useInvestmentPlans } from '../plans';
import { useActivePlanStore } from './store';

/** A deleted plan falls back to the first one. Undefined only while there are no plans. */
function activeOf(
  plans: InvestmentPlan[],
  activePlanId: string | null,
): InvestmentPlan | undefined {
  return plans.find((plan) => plan.id === activePlanId) ?? plans[0];
}

/** The plan whose wallet the app shows. */
export function useActivePlan(): InvestmentPlan | undefined {
  const plans = useInvestmentPlans();
  const activePlanId = useActivePlanStore((state) => state.activePlanId);
  return activeOf(plans, activePlanId);
}

export function getActivePlan(): InvestmentPlan | undefined {
  return activeOf(getInvestmentPlans(), useActivePlanStore.getState().activePlanId);
}
