import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { ThemePreferenceState } from './types';

const STORAGE_KEY = 'theme-preference-v1';

export const initialState: ThemePreferenceState = { preference: 'system' };

/** The chosen theme; MMKV is synchronous, so it is ready before the first stylesheet is created. */
export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
    // Complete the one-time reset of the former version-1 store and persist version 0.
    migrate: () => initialState,
  }),
);
