import type { InvestmentPlan } from '../plan';
import { useInvestmentPlans } from '../plans';
import { useActivePlanStore } from './store';

/**
 * The plan whose wallet the app shows. A deleted plan falls back to the first one. Undefined only
 * while there are no plans.
 */
export function useActivePlan(): InvestmentPlan | undefined {
  const plans = useInvestmentPlans();
  const activePlanId = useActivePlanStore((state) => state.activePlanId);
  return plans.find((plan) => plan.id === activePlanId) ?? plans[0];
}
