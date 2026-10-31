import type { PlanPurchase } from '../portfolio';

import { usePurchasesStore } from './store';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function updatePurchases(update: (current: PlanPurchase[]) => PlanPurchase[]): void {
  usePurchasesStore.setState((state) => ({ purchases: update(state.purchases) }));
}

export function addPurchase(purchase: Omit<PlanPurchase, 'id'>): PlanPurchase {
  const created = { ...purchase, id: newId() };
  updatePurchases((current) => [...current, created]);
  return created;
}

export function removePurchase(id: string): void {
  updatePurchases((current) => {
    const index = current.findIndex((purchase) => purchase.id === id);
    return index < 0 ? current : current.filter((_, itemIndex) => itemIndex !== index);
  });
}

/** Restores the wallet from a backup, replacing everything in it. */
export function replacePurchases(purchases: PlanPurchase[]): void {
  usePurchasesStore.setState({ purchases });
}

/** Removes every purchase of the ISIN in the plan. */
export function removePosition(planId: string, isin: string): void {
  updatePurchases((current) =>
    current.filter((purchase) => purchase.planId !== planId || purchase.isin !== isin),
  );
}

export function removePlanPurchases(planId: string): void {
  updatePurchases((current) => current.filter((purchase) => purchase.planId !== planId));
}

/** Copies every purchase of one plan into another, each under an id of its own. */
export function copyPlanPurchases(fromPlanId: string, toPlanId: string): void {
  updatePurchases((current) => [
    ...current,
    ...current
      .filter((purchase) => purchase.planId === fromPlanId)
      .map((purchase) => ({ ...purchase, id: newId(), planId: toPlanId })),
  ]);
}
