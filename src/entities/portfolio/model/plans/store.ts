import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { PlansState } from './types';

const STORAGE_KEY = 'investment-plan-v1';

export const initialState: PlansState = { plans: [] };

/** Investment plans; their purchases live in the purchases store. */
export const usePlansStore = create<PlansState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
