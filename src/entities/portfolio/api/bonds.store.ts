import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Bond } from '../model/ovdp';
import { fetchBonds } from './nbuBonds';
import { nbuErrorMessage } from '@/shared/api';
import { createPersistStorage, sqliteStorage } from '@/shared/lib';

const CACHE_KEY = 'nbu-bonds-v1';
/** The NBU list changes only when new bonds are issued, so a few hours of staleness is fine. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

type CachedBonds = {
  bonds: Bond[] | null;
  updatedAt: number | null;
};

type BondsRequestState = {
  isFetching: boolean;
  error: string | null;
};

function decodeCachedBonds(value: unknown): CachedBonds | null {
  if (typeof value !== 'object' || value === null) return null;
  if (!('bonds' in value) || !('updatedAt' in value)) return null;
  const { bonds, updatedAt } = value;
  if (bonds !== null && (!Array.isArray(bonds) || !bonds.every(isBond))) return null;
  if (updatedAt !== null && (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)))
    return null;
  return { bonds, updatedAt } as CachedBonds;
}

function isBond(value: unknown): value is Bond {
  if (typeof value !== 'object' || value === null) return false;
  const bond = value as Partial<Bond>;
  return (
    typeof bond.isin === 'string' &&
    typeof bond.nominal === 'number' &&
    Number.isFinite(bond.nominal) &&
    typeof bond.rate === 'number' &&
    Number.isFinite(bond.rate) &&
    typeof bond.currency === 'string' &&
    typeof bond.issueDate === 'string' &&
    typeof bond.maturityDate === 'string' &&
    typeof bond.description === 'string' &&
    Array.isArray(bond.payments) &&
    bond.payments.every(
      (payment) =>
        typeof payment.date === 'string' &&
        (payment.type === 'coupon' || payment.type === 'redemption') &&
        typeof payment.amount === 'number' &&
        Number.isFinite(payment.amount),
    )
  );
}

const useBondsCacheStore = create<CachedBonds>()(
  persist((): CachedBonds => ({ bonds: null, updatedAt: null }), {
    name: CACHE_KEY,
    version: 1,
    storage: createPersistStorage(sqliteStorage, decodeCachedBonds),
  }),
);

const useBondsRequestStore = create<BondsRequestState>()(() => ({
  isFetching: false,
  error: null,
}));

async function refreshBonds(): Promise<void> {
  if (useBondsRequestStore.getState().isFetching) return;
  useBondsRequestStore.setState({ isFetching: true, error: null });
  try {
    const bonds = await fetchBonds();
    const updatedAt = Date.now();
    useBondsCacheStore.setState({ bonds, updatedAt });
    useBondsRequestStore.setState({ isFetching: false });
  } catch (error) {
    useBondsRequestStore.setState({
      isFetching: false,
      error: nbuErrorMessage(error),
    });
  }
}

export function useBonds() {
  const bonds = useBondsCacheStore((state) => state.bonds);
  const isFetching = useBondsRequestStore((state) => state.isFetching);
  const error = useBondsRequestStore((state) => state.error);

  useEffect(() => {
    const lastUpdate = useBondsCacheStore.getState().updatedAt;
    if (!lastUpdate || Date.now() - lastUpdate > STALE_AFTER_MS) {
      void refreshBonds();
    }
    // Only checked on mount: refreshes after that are user-initiated.
  }, []);

  const byIsin = useMemo(() => new Map((bonds ?? []).map((bond) => [bond.isin, bond])), [bonds]);

  return { bonds, isFetching, error, byIsin, refresh: refreshBonds };
}
