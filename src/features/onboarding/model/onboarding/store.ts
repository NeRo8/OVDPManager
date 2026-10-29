import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

import type { OnboardingState } from './types';

const STORAGE_KEY = 'onboarding-v1';

export const initialState: OnboardingState = { isCompleted: false };

/** Whether the introduction to the app has been seen; MMKV has it ready for the first route. */
export const useOnboardingStore = create<OnboardingState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
