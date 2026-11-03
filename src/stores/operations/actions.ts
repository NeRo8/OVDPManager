import { operationHistoryError, refreshOperationBonds } from '@/lib/portfolio/operations';
import type { Bond, PlanOperation } from '@/lib/portfolio/portfolio';
import { todayISO } from '@/utils/date';
import { createId } from '@/utils/id';

import { useOperationsStore } from './store';

function updateOperations(update: (current: PlanOperation[]) => PlanOperation[]): void {
  const operations = update(useOperationsStore.getState().operations);
  const error = operationHistoryError(operations);
  if (error) throw new Error(error);
  useOperationsStore.setState({ operations: refreshOperationBonds(operations, [], todayISO()) });
}

export function addOperation(purchase: Omit<PlanOperation, 'id'>): PlanOperation {
  const created = { ...purchase, id: createId() };
  updateOperations((current) => [...current, created]);
  return created;
}

export function removeOperation(id: string): void {
  updateOperations((current) => current.filter((purchase) => purchase.id !== id));
}

/** Puts in a purchase's real date, quantity and amount: «Підтвердити купівлю» / «Змінити купівлю». */
export function updateOperation(
  id: string,
  changes: Pick<PlanOperation, 'date' | 'quantity' | 'amount'>,
): void {
  updateOperations((current) =>
    current.map((purchase) => (purchase.id === id ? { ...purchase, ...changes } : purchase)),
  );
}

/** Restores the wallet from a backup, replacing everything in it. */
export function replaceOperations(operations: PlanOperation[]): void {
  useOperationsStore.setState({ operations });
}

/** Removes every purchase of the ISIN in the plan. */
export function removePosition(planId: string, isin: string): void {
  updateOperations((current) =>
    current.filter((purchase) => purchase.planId !== planId || purchase.isin !== isin),
  );
}

export function removePlanOperations(planId: string): void {
  updateOperations((current) => current.filter((purchase) => purchase.planId !== planId));
}

/** Copies every purchase of one plan into another, each under an id of its own. */
export function copyPlanOperations(fromPlanId: string, toPlanId: string): void {
  updateOperations((current) => [
    ...current,
    ...current
      .filter((purchase) => purchase.planId === fromPlanId)
      .map((purchase) => ({ ...purchase, id: createId(), planId: toPlanId })),
  ]);
}

/** Save recovered and refreshed snapshots before the replaceable catalog changes. */
export function syncOperationBonds(bonds: Bond[]): void {
  updateOperations((operations) => refreshOperationBonds(operations, bonds, todayISO()));
}

/** A cache may be older than a restored snapshot; only recover missing ISINs from it. */
export function recoverOperationBonds(bonds: Bond[]): void {
  const known = new Set(
    useOperationsStore
      .getState()
      .operations.filter((operation) => operation.ovdp)
      .map((operation) => operation.isin),
  );
  syncOperationBonds(bonds.filter((bond) => !known.has(bond.isin)));
}
