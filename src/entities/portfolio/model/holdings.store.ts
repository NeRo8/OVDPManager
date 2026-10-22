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
 * Purchases read back from storage. Damaged records are left out, and duplicate IDs are repaired
 * so deleting one purchase cannot delete another.
 */
function readStoredHoldings(stored: unknown): Holding[] {
  const state = StoredStateSchema.safeParse(stored);
  if (!state.success) return [];
  const ids = new Set<string>();
  return state.data.holdings.flatMap((item) => {
    const holding = HoldingSchema.safeParse(item);
    if (!holding.success) {
      if (__DEV__) console.warn('Skipped a stored purchase', z.prettifyError(holding.error), item);
      return [];
    }
    let { id } = holding.data;
    if (ids.has(id)) {
      let suffix = 1;
      while (ids.has(`${id}-${suffix}`)) suffix += 1;
      id = `${id}-${suffix}`;
    }
    ids.add(id);
    return [{ ...holding.data, id }];
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
      version: 2,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ holdings }) => ({ holdings }),
      migrate: (stored) => ({ holdings: readStoredHoldings(stored) }),
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
  useHoldingsStore.getState().setHoldings((current) => {
    const index = current.findIndex((holding) => holding.id === id);
    return index < 0 ? current : current.filter((_, itemIndex) => itemIndex !== index);
  });
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
