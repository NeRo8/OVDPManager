import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import {
  LEGACY_PLAN_ID,
  LEGACY_PLAN_NAME,
  type InvestmentPlan,
  type PlannedPurchase,
} from './plan';
import { CURRENCIES, type WalletPurchase } from './portfolio';
import { removePlanPurchases, replacePurchases } from './purchases.store';

export const PLAN_NAME_MAX_LENGTH = 80;
export const PlanNameSchema = z.string().trim().min(1).max(PLAN_NAME_MAX_LENGTH);

export const PlanItemSchema = z
  .object({
    id: z.string().min(1),
    isin: z.string().regex(/^[A-Z]{2}[A-Z0-9]{10}$/),
    currency: z.enum(CURRENCIES),
    date: z.iso.date(),
    quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    pricePerBond: z.number().finite().positive(),
  })
  .refine(
    (item) => item.quantity * item.pricePerBond <= Number.MAX_SAFE_INTEGER,
  ) satisfies z.ZodType<PlannedPurchase>;

export const InvestmentPlanSchema = z
  .object({
    id: z.string().min(1),
    name: PlanNameSchema,
    items: z.array(PlanItemSchema),
  })
  .refine((plan) => new Set(plan.items.map((item) => item.id)).size === plan.items.length, {
    error: 'id запланованої покупки повторюється',
  }) satisfies z.ZodType<InvestmentPlan>;

const STORAGE_KEY = 'investment-plan-v1';
const VERSION = 2;

type PlansStore = {
  plans: InvestmentPlan[];
  setPlans: (update: (current: InvestmentPlan[]) => InvestmentPlan[]) => void;
};

function readLegacyItems(stored: unknown): PlannedPurchase[] {
  const saved = z.object({ items: z.array(z.unknown()) }).safeParse(stored);
  if (!saved.success) return [];
  const ids = new Set<string>();
  return saved.data.items.flatMap((raw) => {
    const item = PlanItemSchema.safeParse(raw);
    if (!item.success || ids.has(item.data.id)) return [];
    ids.add(item.data.id);
    return [item.data];
  });
}

/** The earlier single list becomes one named plan; empty lists stay empty. */
export function legacyPlan(items: PlannedPurchase[]): InvestmentPlan[] {
  return items.length ? [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME, items }] : [];
}

/**
 * Every wallet purchase belongs to a plan. Purchases from backups made before plans held them point
 * at the legacy plan, which is created here when it is missing.
 */
function withPurchasePlans(plans: InvestmentPlan[], purchases: WalletPurchase[]): InvestmentPlan[] {
  const known = new Set(plans.map((plan) => plan.id));
  const missing = new Set(
    purchases.map((purchase) => purchase.planId).filter((id) => !known.has(id)),
  );
  return [...plans, ...[...missing].map((id) => ({ id, name: LEGACY_PLAN_NAME, items: [] }))];
}

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
      version: VERSION,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ plans }) => ({ plans }),
      migrate: (stored, version) => ({
        plans: version < VERSION ? legacyPlan(readLegacyItems(stored)) : readStoredPlans(stored),
      }),
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
  const plan = InvestmentPlanSchema.parse({ id: newId(), name, items: [] });
  usePlansStore.getState().setPlans((plans) => [...plans, plan]);
  return plan.id;
}

export function renameInvestmentPlan(id: string, name: string): void {
  const trimmed = PlanNameSchema.parse(name);
  usePlansStore
    .getState()
    .setPlans((plans) => plans.map((plan) => (plan.id === id ? { ...plan, name: trimmed } : plan)));
}

/** Removes the plan with its planned purchases and its purchases in the wallet. */
export function removeInvestmentPlan(id: string): void {
  removePlanPurchases(id);
  usePlansStore.getState().setPlans((plans) => plans.filter((plan) => plan.id !== id));
}

export function savePlannedPurchase(
  planId: string,
  item: Omit<PlannedPurchase, 'id'>,
  id?: string,
): void {
  const parsed = PlanItemSchema.parse({ ...item, id: id ?? newId() });
  usePlansStore.getState().setPlans((plans) =>
    plans.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            items: id
              ? plan.items.map((existing) => (existing.id === id ? parsed : existing))
              : [...plan.items, parsed],
          }
        : plan,
    ),
  );
}

export function removePlannedPurchase(planId: string, id: string): void {
  usePlansStore
    .getState()
    .setPlans((plans) =>
      plans.map((plan) =>
        plan.id === planId ? { ...plan, items: plan.items.filter((item) => item.id !== id) } : plan,
      ),
    );
}

/** Restores from a backup. Without `plans` (an older backup) the current plans are kept. */
export function restorePortfolio(purchases: WalletPurchase[], plans?: InvestmentPlan[]): void {
  replacePurchases(purchases);
  usePlansStore.getState().setPlans((current) => withPurchasePlans(plans ?? current, purchases));
}
