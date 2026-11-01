import { createId } from '@/shared/lib';

import { type InvestmentPlan, PLAN_NAME_MAX_LENGTH, uniquePlanName } from '../plan';
import type { PlanPurchase } from '../portfolio';
import { copyPlanPurchases, removePlanPurchases, replacePurchases } from '../purchases';

import { usePlansStore } from './store';

function updatePlans(update: (current: InvestmentPlan[]) => InvestmentPlan[]): void {
  usePlansStore.setState((state) => ({ plans: update(state.plans) }));
}

/** `name` comes from the plan-name form, already trimmed and checked. */
export function createInvestmentPlan(name: string): string {
  const plan: InvestmentPlan = {
    id: createId(),
    name,
    isActive: usePlansStore.getState().plans.length === 0,
  };
  updatePlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  updatePlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name } : plan)));
}

const COPY_SUFFIX = ' (копія)';

/**
 * Copies the plan with all its purchases under the name «… (копія)», cut to fit the
 * name's limit.
 * The active plan stays as it was. Returns the copy's name.
 */
export function duplicateInvestmentPlan(id: string): string | undefined {
  const plan = usePlansStore.getState().plans.find((item) => item.id === id);
  if (!plan) return undefined;
  const name = uniquePlanName(
    plan.name.slice(0, PLAN_NAME_MAX_LENGTH - COPY_SUFFIX.length).trimEnd() + COPY_SUFFIX,
    usePlansStore.getState().plans,
  );
  copyPlanPurchases(id, createInvestmentPlan(name));
  return name;
}

/** Removes the plan with all its purchases. */
export function removeInvestmentPlan(id: string): void {
  removePlanPurchases(id);
  updatePlans((plans) => selectActivePlan(plans.filter((plan) => plan.id !== id)));
}

/** Select one plan, falling back to the existing selection or the first plan. */
function selectActivePlan(plans: InvestmentPlan[], id?: string): InvestmentPlan[] {
  const selected =
    plans.find((plan) => plan.id === id) ?? plans.find((plan) => plan.isActive) ?? plans[0];
  return plans.map((plan) => ({ ...plan, isActive: plan.id === selected?.id }));
}

export function setActivePlan(id: string): void {
  updatePlans((plans) => selectActivePlan(plans, id));
}

/** Restores from a backup: its plans and their purchases replace everything. */
export function restorePortfolio(purchases: PlanPurchase[], plans: InvestmentPlan[]): void {
  replacePurchases(purchases);
  usePlansStore.setState({ plans: selectActivePlan(plans) });
}
