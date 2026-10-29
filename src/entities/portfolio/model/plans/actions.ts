import type { InvestmentPlan } from '../plan';
import type { PlanPurchase } from '../portfolio';
import { removePlanPurchases, replacePurchases } from '../purchases';

import { usePlansStore } from './store';

function updatePlans(update: (current: InvestmentPlan[]) => InvestmentPlan[]): void {
  usePlansStore.setState((state) => ({ plans: update(state.plans) }));
}

/** `name` comes from the plan-name form, already trimmed and checked. */
export function createInvestmentPlan(name: string): string {
  const plan: InvestmentPlan = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
  };
  updatePlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  updatePlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name } : plan)));
}

/** Removes the plan with all its purchases. */
export function removeInvestmentPlan(id: string): void {
  removePlanPurchases(id);
  updatePlans((plans) => plans.filter((plan) => plan.id !== id));
}

/** Restores from a backup: its plans and their purchases replace everything. */
export function restorePortfolio(purchases: PlanPurchase[], plans: InvestmentPlan[]): void {
  replacePurchases(purchases);
  usePlansStore.setState({ plans });
}
