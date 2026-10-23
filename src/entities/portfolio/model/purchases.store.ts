import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WalletPurchase } from './portfolio';
import { mmkvStorage } from '@/shared/lib';

// Keep the existing MMKV key so installed apps can read their saved purchases.
const STORAGE_KEY = 'holdings-v1';

type PurchasesState = {
  purchases: WalletPurchase[];
};

type PurchasesActions = {
  setPurchases: (
    next: WalletPurchase[] | ((current: WalletPurchase[]) => WalletPurchase[]),
  ) => void;
};

type PurchasesStore = PurchasesState & PurchasesActions;

const initialState: PurchasesState = {
  purchases: [],
};

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
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ purchases }) => ({ purchases }),
    },
  ),
);

/** Purchases of every plan. */
export function usePurchases(): WalletPurchase[] {
  return usePurchasesStore((state) => state.purchases);
}

export function addPurchase(purchase: Omit<WalletPurchase, 'id'>): WalletPurchase {
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
export function replacePurchases(next: WalletPurchase[]) {
  usePurchasesStore.getState().setPurchases(next);
}

/** Removes every purchase of the ISIN in the plan. */
export function removePosition(planId: string, isin: string) {
  usePurchasesStore
    .getState()
    .setPurchases((current) =>
      current.filter((purchase) => purchase.planId !== planId || purchase.isin !== isin),
    );
}

export function removePlanPurchases(planId: string) {
  usePurchasesStore
    .getState()
    .setPurchases((current) => current.filter((purchase) => purchase.planId !== planId));
}
