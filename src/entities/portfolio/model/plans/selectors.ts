import type { InvestmentPlan } from '../plan';
import { usePlansStore } from './store';

export function useInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore((state) => state.plans);
}
