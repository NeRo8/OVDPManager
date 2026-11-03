import type { PlanPurchase } from '@/lib/portfolio/portfolio';
import { createInvestmentPlan, setActivePlan } from '@/stores/plans';
import { addPurchase, removePosition } from '@/stores/purchases';

import { getActivePlan } from './selectors';

/** A new plan becomes active, ready for its first purchases. */
export function createActivePlan(name: string): void {
  setActivePlan(createInvestmentPlan(name));
}

/**
 * Adds the purchase to the active plan. The app's screens open only once there is a plan, so one
 * is always active; without it nothing is added.
 */
export function addPurchaseToActivePlan(purchase: Omit<PlanPurchase, 'id' | 'planId'>): boolean {
  const plan = getActivePlan();
  if (!plan) return false;
  addPurchase({ ...purchase, planId: plan.id });
  return true;
}

/** Removes every purchase of the ISIN from the active plan. */
export function removePositionFromActivePlan(isin: string): void {
  const plan = getActivePlan();
  if (plan) removePosition(plan.id, isin);
}
