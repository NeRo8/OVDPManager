import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayISO } from '@/utils/date';
import { mmkvStorage } from '@/utils/storage';

import type { AppSettingsState } from './types';

// Keep the existing key so an already selected theme is retained.
const STORAGE_KEY = 'theme-preference-v1';

export const initialState: AppSettingsState = {
  preference: 'system',
  isOnboardingCompleted: false,
  today: todayISO(),
  toast: null,
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
    // Today is taken again on every launch, and a toast does not outlive the session.
    partialize: ({ preference, isOnboardingCompleted }) => ({ preference, isOnboardingCompleted }),
  }),
);
