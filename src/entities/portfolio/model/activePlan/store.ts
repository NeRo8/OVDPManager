import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { ActivePlanState } from './types';

const STORAGE_KEY = 'active-plan-v1';

export const initialState: ActivePlanState = { activePlanId: null };

/** The plan whose wallet the app shows, kept across launches. */
export const useActivePlanStore = create<ActivePlanState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
