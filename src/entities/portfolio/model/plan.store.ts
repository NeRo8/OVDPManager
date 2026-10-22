import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { InvestmentPlan } from './plan';
import type { WalletPurchase } from './portfolio';
import { removePlanPurchases, replacePurchases } from './purchases.store';

export const PLAN_NAME_MAX_LENGTH = 80;
export const PlanNameSchema = z.string().trim().min(1).max(PLAN_NAME_MAX_LENGTH);

/** A plan; its purchases are wallet purchases with its `planId`. */
export const InvestmentPlanSchema = z.object({
  id: z.string().min(1),
  name: PlanNameSchema,
}) satisfies z.ZodType<InvestmentPlan>;

const STORAGE_KEY = 'investment-plan-v1';

type PlansStore = {
  plans: InvestmentPlan[];
  setPlans: (update: (current: InvestmentPlan[]) => InvestmentPlan[]) => void;
};

function readStoredPlans(stored: unknown): InvestmentPlan[] {
  const saved = z.object({ plans: z.array(z.unknown()) }).safeParse(stored);
  if (!saved.success) return [];
  const ids = new Set<string>();
  return saved.data.plans.flatMap((raw) => {
    const plan = InvestmentPlanSchema.safeParse(raw);
    if (!plan.success || ids.has(plan.data.id)) return [];
    ids.add(plan.data.id);
    return [plan.data];
  });
}

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
      merge: (stored, current) => ({ ...current, plans: readStoredPlans(stored) }),
    },
  ),
);

export function useInvestmentPlans(): InvestmentPlan[] {
  return usePlansStore((state) => state.plans);
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInvestmentPlan(name: string): string {
  const plan = InvestmentPlanSchema.parse({ id: newId(), name });
  usePlansStore.getState().setPlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  const trimmed = PlanNameSchema.parse(name);
  usePlansStore
    .getState()
    .setPlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name: trimmed } : plan)));
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
