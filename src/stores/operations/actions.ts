import { SCHEDULE_EVENT_TYPES } from '@/lib/payment-filters/scheduleEventTypes';
import { operationHistoryError, refreshOperationBonds } from '@/lib/portfolio/operations';
import type { Bond, PlanOperation } from '@/lib/portfolio/portfolio';
import { todayISO } from '@/utils/date';
import { createId } from '@/utils/id';

import { initialState, useOperationsStore } from './store';
import type { PaymentFilters, ScheduleEventType, WalletFilters } from './types';

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

/**
 * Puts in an operation's real date, quantity and amount, and whether it is still planned: confirming
 * it («Підтвердити купівлю» / «Підтвердити продаж») or correcting it («Змінити …»).
 */
export function updateOperation(
  id: string,
  changes: Pick<PlanOperation, 'date' | 'quantity' | 'amount' | 'planned'>,
): void {
  updateOperations((current) =>
    current.map((purchase) =>
      purchase.id === id
        ? { ...purchase, ...changes, ...(purchase.goalGenerated ? { goalGenerated: false } : {}) }
        : purchase,
    ),
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

export function updatePaymentFilters(patch: Partial<PaymentFilters>): void {
  useOperationsStore.setState(({ filters }) => ({
    filters: { ...filters, ...patch },
  }));
}

/**
 * Adds the event type to the shown ones, or removes it. Every type picked, or none left, shows
 * every type, as the bonds do.
 */
export function togglePaymentFilterType(type: ScheduleEventType): void {
  const { types } = useOperationsStore.getState().filters;
  const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
  updatePaymentFilters({ types: next.length === SCHEDULE_EVENT_TYPES.length ? [] : next });
}

/** Adds the bond to the shown ones, or removes it. */
export function togglePaymentFilterIsin(isin: string): void {
  const { isins } = useOperationsStore.getState().filters;
  updatePaymentFilters({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  });
}

export function resetPaymentFilters(): void {
  useOperationsStore.setState({ filters: initialState.filters });
}

export function updateWalletFilters(patch: Partial<WalletFilters>): void {
  useOperationsStore.setState(({ walletFilters }) => ({
    walletFilters: { ...walletFilters, ...patch },
  }));
}

export function resetWalletFilters(): void {
  useOperationsStore.setState({ walletFilters: initialState.walletFilters });
}
