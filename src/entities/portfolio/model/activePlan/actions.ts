import { createInvestmentPlan } from '../plans';
import type { PlanPurchase } from '../portfolio';
import { addPurchase, removePosition } from '../purchases';

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
