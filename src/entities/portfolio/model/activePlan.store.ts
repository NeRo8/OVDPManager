import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { InvestmentPlan } from './plan';
import { useInvestmentPlans } from './plan.store';

const STORAGE_KEY = 'active-plan-v1';

type ActivePlanStore = {
  activePlanId: string | null;
};

const useActivePlanStore = create<ActivePlanStore>()(
  persist((): ActivePlanStore => ({ activePlanId: null }), {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
    merge: (stored, current) => {
      const saved = z.object({ activePlanId: z.string().nullable() }).safeParse(stored);
      return { ...current, activePlanId: saved.success ? saved.data.activePlanId : null };
    },
  }),
);

/**
 * The plan whose wallet the app shows; the choice is kept across launches. A deleted plan falls
 * back to the first one. Undefined only while there are no plans.
 */
export function useActivePlan(): InvestmentPlan | undefined {
  const plans = useInvestmentPlans();
  const activePlanId = useActivePlanStore((state) => state.activePlanId);
  return plans.find((plan) => plan.id === activePlanId) ?? plans[0];
}

export function setActivePlan(id: string): void {
  useActivePlanStore.setState({ activePlanId: id });
}
