import type { InvestmentPlan } from '@/lib/portfolio/plan';

import { usePlansStore } from './store';

export function useInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore((state) => state.plans);
}

export function getInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore.getState().plans;
}
