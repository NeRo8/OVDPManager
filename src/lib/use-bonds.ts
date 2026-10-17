import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { type Bond, fetchBonds } from '@/lib/ovdp';
import { storage } from '@/lib/storage';

const CACHE_KEY = 'nbu-bonds-v1';
/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

type BondsState = {
  bonds: Bond[] | null;
  updatedAt: number | null;
  isFetching: boolean;
  error: string | null;
};

const initialState: BondsState = { bonds: null, updatedAt: null, isFetching: false, error: null };

let state = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function setState(patch: Partial<BondsState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const cached = storage.get(CACHE_KEY);
    if (cached) {
      const { bonds, updatedAt } = JSON.parse(cached) as { bonds: Bond[]; updatedAt: number };
      state = { ...state, bonds, updatedAt };
    }
  } catch {
    // Corrupt cache — it will be replaced by the next successful fetch.
  }
}

export async function refreshBonds(): Promise<void> {
  if (state.isFetching) return;
  setState({ isFetching: true, error: null });
  try {
    const bonds = await fetchBonds();
    const updatedAt = Date.now();
    setState({ bonds, updatedAt, isFetching: false });
    storage.set(CACHE_KEY, JSON.stringify({ bonds, updatedAt }));
  } catch (error) {
    setState({
      isFetching: false,
      error: error instanceof Error ? error.message : 'Не вдалося завантажити дані НБУ',
    });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return state;
}

export function useBonds() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => initialState);

  useEffect(() => {
    if (!current.updatedAt || Date.now() - current.updatedAt > STALE_AFTER_MS) {
      void refreshBonds();
    }
    // Only checked on mount: refreshes after that are user-initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byIsin = useMemo(
    () => new Map((current.bonds ?? []).map((bond) => [bond.isin, bond])),
    [current.bonds],
  );

  return { ...current, byIsin, refresh: refreshBonds };
}
