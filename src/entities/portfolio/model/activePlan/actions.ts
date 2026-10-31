import { type CouponGoal, PLAN_NAME_MAX_LENGTH } from '../plan';
import { createInvestmentPlan } from '../plans';
import type { PlanPurchase } from '../portfolio';
import { addPurchase, copyPlanPurchases, removePosition } from '../purchases';

import { getActivePlan } from './selectors';
import { useActivePlanStore } from './store';

export function setActivePlan(activePlanId: string): void {
  useActivePlanStore.setState({ activePlanId });
}

/** A new plan becomes active, ready for its first purchases. */
export function createActivePlan(name: string): void {
  setActivePlan(createInvestmentPlan(name));
}

/**
 * Adds the purchase to the active plan. The app's screens open only once there is a plan, so one
 * is always active; without it nothing is added.
 */
export function addPurchaseToActivePlan(purchase: Omit<PlanPurchase, 'id' | 'planId'>): void {
  const plan = getActivePlan();
  if (plan) addPurchase({ ...purchase, planId: plan.id });
}

/** Removes every purchase of the ISIN from the active plan. */
export function removePositionFromActivePlan(isin: string): void {
  const plan = getActivePlan();
  if (plan) removePosition(plan.id, isin);
}

/**
 * The «План з ціллю»: a copy of the active plan named «<план> · ціль <рік>», cut to the name's
 * limit, with the coupon goal's purchases added and the goal kept on it. The copy becomes active;
 * the plan it was copied from stays as it was. Returns the copy's name.
 */
export function createGoalPlan(
  goal: CouponGoal,
  purchases: Omit<PlanPurchase, 'id' | 'planId'>[],
): string | undefined {
  const plan = getActivePlan();
  if (!plan) return undefined;
  const suffix = ` · ціль ${goal.year}`;
  const name = plan.name.slice(0, PLAN_NAME_MAX_LENGTH - suffix.length).trimEnd() + suffix;
  const id = createInvestmentPlan(name, goal);
  copyPlanPurchases(plan.id, id);
  for (const purchase of purchases) addPurchase({ ...purchase, planId: id });
  setActivePlan(id);
  return name;
}
