import { type CouponGoal, type InvestmentPlan, PLAN_NAME_MAX_LENGTH } from '../plan';
import type { PlanPurchase } from '../portfolio';
import { copyPlanPurchases, removePlanPurchases, replacePurchases } from '../purchases';

import { usePlansStore } from './store';

function updatePlans(update: (current: InvestmentPlan[]) => InvestmentPlan[]): void {
  usePlansStore.setState((state) => ({ plans: update(state.plans) }));
}

/** `name` comes from the plan-name form, already trimmed and checked; a goal plan brings its goal. */
export function createInvestmentPlan(name: string, goal?: CouponGoal): string {
  const plan: InvestmentPlan = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    ...(goal && { goal }),
  };
  updatePlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  updatePlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name } : plan)));
}

const COPY_SUFFIX = ' (копія)';

/**
 * Copies the plan with all its purchases and its goal under the name «… (копія)», cut to fit the
 * name's limit.
 * The active plan stays as it was. Returns the copy's name.
 */
export function duplicateInvestmentPlan(id: string): string | undefined {
  const plan = usePlansStore.getState().plans.find((item) => item.id === id);
  if (!plan) return undefined;
  const name =
    plan.name.slice(0, PLAN_NAME_MAX_LENGTH - COPY_SUFFIX.length).trimEnd() + COPY_SUFFIX;
  copyPlanPurchases(id, createInvestmentPlan(name, plan.goal));
  return name;
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
