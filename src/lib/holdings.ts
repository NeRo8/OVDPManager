import { useSyncExternalStore } from 'react';

import type { Holding } from '@/lib/ovdp';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'holdings-v1';
const EMPTY: Holding[] = [];

let holdings: Holding[] | null = null;
const listeners = new Set<() => void>();

function load(): Holding[] {
  if (holdings) return holdings;
  try {
    const saved = storage.get(STORAGE_KEY);
    holdings = saved ? (JSON.parse(saved) as Holding[]) : [];
  } catch {
    holdings = [];
  }
  return holdings;
}

function save(next: Holding[]) {
  holdings = next;
  storage.set(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHoldings(): Holding[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function addHolding(holding: Omit<Holding, 'id'>): Holding {
  const created = {
    ...holding,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
  save([...load(), created]);
  return created;
}

export function removeHolding(id: string) {
  save(load().filter((h) => h.id !== id));
}

/** Restores the wallet from a backup, replacing everything in it. */
export function replaceHoldings(next: Holding[]) {
  save(next);
}

/** Removes every purchase of the ISIN. */
export function removePosition(isin: string) {
  save(load().filter((h) => h.isin !== isin));
}
