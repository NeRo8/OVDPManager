import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { HoldingSchema } from './holding.schema';
import type { Holding } from './ovdp';
import { mmkvStorage } from '@/shared/lib';

const STORAGE_KEY = 'holdings-v1';

type HoldingsState = {
  holdings: Holding[];
};

type HoldingsActions = {
  setHoldings: (next: Holding[] | ((current: Holding[]) => Holding[])) => void;
};

type HoldingsStore = HoldingsState & HoldingsActions;

const initState: HoldingsState = {
  holdings: [],
};

const StoredStateSchema = z.object({ holdings: z.array(z.unknown()) });

/**
 * Purchases read back from storage. A damaged record is left out rather than allowed to break the
 * calculations for the whole wallet.
 */
function readStoredHoldings(stored: unknown): Holding[] {
  const state = StoredStateSchema.safeParse(stored);
  if (!state.success) return [];
  return state.data.holdings.flatMap((item) => {
    const holding = HoldingSchema.safeParse(item);
    if (!holding.success) {
      if (__DEV__) console.warn('Skipped a stored purchase', z.prettifyError(holding.error), item);
      return [];
    }
    return [holding.data];
  });
}

const useHoldingsStore = create<HoldingsStore>()(
  persist(
    (set) => ({
      ...initState,
      setHoldings: (next) =>
        set((state) => ({
          holdings: typeof next === 'function' ? next(state.holdings) : next,
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ holdings }) => ({ holdings }),
      merge: (stored, current) => ({ ...current, holdings: readStoredHoldings(stored) }),
    },
  ),
);

export function useHoldings(): Holding[] {
  return useHoldingsStore((state) => state.holdings);
}

export function addHolding(holding: Omit<Holding, 'id'>): Holding {
  const created = {
    ...holding,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
  useHoldingsStore.getState().setHoldings((current) => [...current, created]);
  return created;
}

export function removeHolding(id: string) {
  useHoldingsStore
    .getState()
    .setHoldings((current) => current.filter((holding) => holding.id !== id));
}

/** Restores the wallet from a backup, replacing everything in it. */
export function replaceHoldings(next: Holding[]) {
  useHoldingsStore.getState().setHoldings(next);
}

/** Removes every purchase of the ISIN. */
export function removePosition(isin: string) {
  useHoldingsStore
    .getState()
    .setHoldings((current) => current.filter((holding) => holding.isin !== isin));
}
