import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { InvestmentPlan } from './plan';
import type { WalletPurchase } from './portfolio';
import { removePlanPurchases, replacePurchases } from './purchases.store';

export const PLAN_NAME_MAX_LENGTH = 80;

const STORAGE_KEY = 'investment-plan-v1';

type PlansStore = {
  plans: InvestmentPlan[];
  setPlans: (update: (current: InvestmentPlan[]) => InvestmentPlan[]) => void;
};

const usePlansStore = create<PlansStore>()(
  persist(
    (set) => ({
      plans: [],
      setPlans: (update) => set((state) => ({ plans: update(state.plans) })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ plans }) => ({ plans }),
    },
  ),
);

export function useInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore((state) => state.plans);
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** `name` comes from the plan-name form, already trimmed and checked. */
export function createInvestmentPlan(name: string): string {
  const plan: InvestmentPlan = { id: newId(), name };
  usePlansStore.getState().setPlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  usePlansStore
    .getState()
    .setPlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name } : plan)));
}

/** Removes the plan with all its purchases. */
export function removeInvestmentPlan(id: string): void {
  removePlanPurchases(id);
  usePlansStore.getState().setPlans((plans) => plans.filter((plan) => plan.id !== id));
}

/** Restores from a backup: its plans and their purchases replace everything. */
export function restorePortfolio(purchases: WalletPurchase[], plans: InvestmentPlan[]): void {
  replacePurchases(purchases);
  usePlansStore.getState().setPlans(() => plans);
}
