import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Holding } from './ovdp';
import { createPersistStorage, sqliteStorage } from '@/shared/lib';

const STORAGE_KEY = 'holdings-v1';

type HoldingsState = {
  holdings: Holding[];
  setHoldings: (next: Holding[] | ((current: Holding[]) => Holding[])) => void;
};

function isHolding(value: unknown): value is Holding {
  if (typeof value !== 'object' || value === null) return false;
  const holding = value as Partial<Holding>;
  return (
    typeof holding.id === 'string' &&
    typeof holding.isin === 'string' &&
    typeof holding.purchaseDate === 'string' &&
    typeof holding.amount === 'number' &&
    Number.isFinite(holding.amount) &&
    typeof holding.quantity === 'number' &&
    Number.isFinite(holding.quantity)
  );
}

function decodeHoldings(value: unknown): { holdings: Holding[] } | null {
  if (typeof value !== 'object' || value === null || !('holdings' in value)) return null;
  const { holdings } = value;
  return Array.isArray(holdings) && holdings.every(isHolding) ? { holdings } : null;
}

function decodeLegacyHoldings(value: unknown): { holdings: Holding[] } | null {
  return Array.isArray(value) && value.every(isHolding) ? { holdings: value } : null;
}

const useHoldingsStore = create<HoldingsState>()(
  persist(
    (set) => ({
      holdings: [],
      setHoldings: (next) =>
        set((state) => ({
          holdings: typeof next === 'function' ? next(state.holdings) : next,
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createPersistStorage(sqliteStorage, decodeHoldings, decodeLegacyHoldings),
      partialize: ({ holdings }) => ({ holdings }),
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
