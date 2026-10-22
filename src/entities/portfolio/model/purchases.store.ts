import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PurchaseSchema } from './purchase.schema';
import type { Purchase } from './portfolio';
import { mmkvStorage } from '@/shared/lib';

// Keep the existing MMKV key so installed apps can read their saved purchases.
const STORAGE_KEY = 'holdings-v1';

type PurchasesState = {
  purchases: Purchase[];
};

type PurchasesActions = {
  setPurchases: (next: Purchase[] | ((current: Purchase[]) => Purchase[])) => void;
};

type PurchasesStore = PurchasesState & PurchasesActions;

const initialState: PurchasesState = {
  purchases: [],
};

const StoredStateSchema = z.union([
  z.object({ purchases: z.array(z.unknown()) }).transform((state) => state.purchases),
  z.object({ holdings: z.array(z.unknown()) }).transform((state) => state.holdings),
]);

/**
 * Purchases read back from storage. Damaged records are left out, and duplicate IDs are repaired
 * so deleting one purchase cannot delete another.
 */
function readStoredPurchases(stored: unknown): Purchase[] {
  const savedPurchases = StoredStateSchema.safeParse(stored);
  if (!savedPurchases.success) return [];
  const ids = new Set<string>();
  return savedPurchases.data.flatMap((item) => {
    const purchase = PurchaseSchema.safeParse(item);
    if (!purchase.success) {
      if (__DEV__) console.warn('Skipped a stored purchase', z.prettifyError(purchase.error), item);
      return [];
    }
    let { id } = purchase.data;
    if (ids.has(id)) {
      let suffix = 1;
      while (ids.has(`${id}-${suffix}`)) suffix += 1;
      id = `${id}-${suffix}`;
    }
    ids.add(id);
    return [{ ...purchase.data, id }];
  });
}

const usePurchasesStore = create<PurchasesStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPurchases: (next) =>
        set((state) => ({
          purchases: typeof next === 'function' ? next(state.purchases) : next,
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ purchases }) => ({ purchases }),
      migrate: (stored) => ({ purchases: readStoredPurchases(stored) }),
      merge: (stored, current) => ({ ...current, purchases: readStoredPurchases(stored) }),
    },
  ),
);

export function usePurchases(): Purchase[] {
  return usePurchasesStore((state) => state.purchases);
}

export function addPurchase(purchase: Omit<Purchase, 'id'>): Purchase {
  const created = {
    ...purchase,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
  usePurchasesStore.getState().setPurchases((current) => [...current, created]);
  return created;
}

export function removePurchase(id: string) {
  usePurchasesStore.getState().setPurchases((current) => {
    const index = current.findIndex((purchase) => purchase.id === id);
    return index < 0 ? current : current.filter((_, itemIndex) => itemIndex !== index);
  });
}

/** Restores the wallet from a backup, replacing everything in it. */
export function replacePurchases(next: Purchase[]) {
  usePurchasesStore.getState().setPurchases(next);
}

/** Removes every purchase of the ISIN. */
export function removePosition(isin: string) {
  usePurchasesStore
    .getState()
    .setPurchases((current) => current.filter((purchase) => purchase.isin !== isin));
}
