import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type ForecastPlan, defaultPlan, TERM_OPTIONS } from './forecast';
import { createPersistStorage, sqliteStorage, toISODate } from '@/shared/lib';

const STORAGE_KEY = 'forecast-plan-v1';
const DEFAULT = defaultPlan(toISODate(new Date()));

type PlanState = {
  plan: ForecastPlan;
  updatePlan: (patch: Partial<ForecastPlan>) => void;
};

function decodePlan(value: unknown): ForecastPlan | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const saved = value as Partial<ForecastPlan>;
  const plan = { ...DEFAULT };

  if (typeof saved.monthlyUsd === 'number' && Number.isFinite(saved.monthlyUsd))
    plan.monthlyUsd = saved.monthlyUsd;
  if (
    saved.usdRate === null ||
    (typeof saved.usdRate === 'number' && Number.isFinite(saved.usdRate))
  )
    plan.usdRate = saved.usdRate;
  if (typeof saved.contributeUntilYear === 'number' && Number.isFinite(saved.contributeUntilYear))
    plan.contributeUntilYear = saved.contributeUntilYear;
  if (typeof saved.reinvestUntilYear === 'number' && Number.isFinite(saved.reinvestUntilYear))
    plan.reinvestUntilYear = saved.reinvestUntilYear;
  if (typeof saved.reinvestNominal === 'boolean') plan.reinvestNominal = saved.reinvestNominal;
  if (typeof saved.yieldRate === 'number' && Number.isFinite(saved.yieldRate))
    plan.yieldRate = saved.yieldRate;
  if (TERM_OPTIONS.some((term) => term === saved.termMonths))
    plan.termMonths = saved.termMonths as ForecastPlan['termMonths'];

  return plan;
}

function decodeStoredPlan(value: unknown): { plan: ForecastPlan } | null {
  if (typeof value !== 'object' || value === null || !('plan' in value)) return null;
  const plan = decodePlan(value.plan);
  return plan === null ? null : { plan };
}

function decodeLegacyPlan(value: unknown): { plan: ForecastPlan } | null {
  const plan = decodePlan(value);
  return plan === null ? null : { plan };
}

const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: DEFAULT,
      updatePlan: (patch) => set((state) => ({ plan: { ...state.plan, ...patch } })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createPersistStorage(sqliteStorage, decodeStoredPlan, decodeLegacyPlan),
      partialize: ({ plan }) => ({ plan }),
    },
  ),
);

export function usePlan(): ForecastPlan {
  return usePlanStore((state) => state.plan);
}

export function updatePlan(patch: Partial<ForecastPlan>) {
  usePlanStore.getState().updatePlan(patch);
}
