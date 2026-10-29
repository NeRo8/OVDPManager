import type { PlanPurchase } from '../portfolio';

import { usePurchasesStore } from './store';

/** Purchases of every plan. */
export function usePurchases(): PlanPurchase[] {
  return usePurchasesStore((state) => state.purchases);
}

/** Purchases of every plan. */
export function getPurchases(): PlanPurchase[] {
  return usePurchasesStore.getState().purchases;
}
