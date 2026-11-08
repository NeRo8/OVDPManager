import { operationHistoryError } from '@/lib/portfolio/operations';
import {
  type CouponGoal,
  type InvestmentPlan,
  PLAN_NAME_MAX_LENGTH,
  uniquePlanName,
} from '@/lib/portfolio/plan';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import { getCachedBonds } from '@/stores/bonds/selectors';
import {
  recoverOperationBonds,
  addOperation,
  removePosition,
  copyPlanOperations,
  removePlanOperations,
  replaceOperations,
  getOperations,
} from '@/stores/operations';
import { useOperationsStore } from '@/stores/operations/store';
import { createId } from '@/utils/id';
import { portfolioUpdate } from '@/utils/storage';

import { getActivePlan } from './selectors';
import { usePlansStore } from './store';

function updatePlans(update: (current: InvestmentPlan[]) => InvestmentPlan[]): void {
  usePlansStore.setState((state) => ({ plans: update(state.plans) }));
}

function updatePortfolio(update: () => void): void {
  const operations = useOperationsStore.getState();
  const plans = usePlansStore.getState();
  try {
    portfolioUpdate(update);
  } catch (error) {
    useOperationsStore.setState(operations, true);
    usePlansStore.setState(plans, true);
    throw error;
  }
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
 * Copies the plan with all its operations under the name «… (копія)», cut to fit the
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
  updatePortfolio(() => {
    const copyId = createInvestmentPlan(name);
    copyPlanOperations(id, copyId);
    if (plan.goal)
      updatePlans((plans) =>
        plans.map((item) => (item.id === copyId ? { ...item, goal: plan.goal } : item)),
      );
  });
  return name;
}

/** Removes the plan with all its operations. */
export function removeInvestmentPlan(id: string): void {
  updatePortfolio(() => {
    removePlanOperations(id);
    updatePlans((plans) => selectActivePlan(plans.filter((plan) => plan.id !== id)));
  });
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

/** Restores from a backup: its plans and their operations replace everything. */
export function restorePortfolio(operations: PlanOperation[], plans: InvestmentPlan[]): void {
  updatePortfolio(() => {
    replaceOperations(operations);
    recoverOperationBonds(getCachedBonds().bonds ?? []);
    usePlansStore.setState({ plans: selectActivePlan(plans) });
  });
}

/** A new plan becomes active, ready for its first operations. */
export function createActivePlan(name: string): void {
  setActivePlan(createInvestmentPlan(name));
}

/** Create a copy with the new goal's purchases, replacing only unconfirmed generated purchases. */
export function createCouponGoalPlan(
  goal: CouponGoal,
  purchases: Omit<PlanOperation, 'id' | 'planId'>[],
): string | undefined {
  const source = getActivePlan();
  if (!source) return undefined;
  if (
    purchases.some(
      (purchase) =>
        !Number.isSafeInteger(purchase.quantity) ||
        purchase.quantity <= 0 ||
        !Number.isFinite(purchase.amount) ||
        purchase.amount <= 0 ||
        purchase.amount > Number.MAX_SAFE_INTEGER,
    )
  )
    throw new Error('Розраховані суми або кількість завеликі. Зменшіть ціль.');
  const id = createId();
  const baseName = source.goal
    ? source.name.replace(/ · ціль \d{4}(?: \(\d+\))?$/, '')
    : source.name;
  const name = uniquePlanName(`${baseName} · ціль ${goal.year}`, usePlansStore.getState().plans);
  const current = getOperations();
  const copied = current
    .filter(
      (operation) =>
        operation.planId === source.id && !(operation.goalGenerated && operation.planned),
    )
    .map((operation) => ({ ...operation, id: createId(), planId: id }));
  const generated = purchases.map((purchase) => ({ ...purchase, id: createId(), planId: id }));
  const operations = [...current, ...copied, ...generated];
  const error = operationHistoryError(operations);
  if (error) throw new Error(error);
  updatePortfolio(() => {
    replaceOperations(operations);
    updatePlans((plans) => [
      ...plans.map((plan) => ({ ...plan, isActive: false })),
      { id, name, isActive: true, goal },
    ]);
  });
  return name;
}

/** Remove the goal while keeping its purchases as ordinary plan operations. */
export function removeCouponGoalFromActivePlan(): void {
  const plan = getActivePlan();
  if (!plan?.goal) return;
  updatePortfolio(() => {
    replaceOperations(
      getOperations().map((operation) =>
        operation.planId === plan.id && operation.goalGenerated
          ? { ...operation, goalGenerated: false }
          : operation,
      ),
    );
    updatePlans((plans) =>
      plans.map((item) => {
        if (item.id !== plan.id) return item;
        const { goal: _goal, ...rest } = item;
        return rest;
      }),
    );
  });
}

/**
 * Adds the purchase to the active plan. The app's screens open only once there is a plan, so one
 * is always active; without it nothing is added.
 */
export function addOperationToActivePlan(purchase: Omit<PlanOperation, 'id' | 'planId'>): boolean {
  const plan = getActivePlan();
  if (!plan) return false;
  addOperation({ ...purchase, planId: plan.id });
  return true;
}

/** Removes every purchase of the ISIN from the active plan. */
export function removePositionFromActivePlan(isin: string): void {
  const plan = getActivePlan();
  if (plan) removePosition(plan.id, isin);
}
