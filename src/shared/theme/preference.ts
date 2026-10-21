import { Appearance } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';

/** `system` follows the device's light or dark appearance. */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

type ThemePreferenceState = {
  preference: ThemePreference;
};

const StoredPreferenceSchema = z.object({ preference: z.enum(THEME_PREFERENCES) });

const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist((): ThemePreferenceState => ({ preference: 'system' }), {
    name: 'theme-preference-v1',
    version: 1,
    storage: createJSONStorage(() => mmkvStorage),
    // An unknown stored value would make Unistyles throw on startup, so it falls back to `system`.
    merge: (stored, current) => {
      const parsed = StoredPreferenceSchema.safeParse(stored);
      return parsed.success ? { ...current, ...parsed.data } : current;
    },
  }),
);

/** The saved choice; MMKV is synchronous, so it is ready before the first stylesheet is created. */
export function getThemePreference(): ThemePreference {
  return useThemePreferenceStore.getState().preference;
}

export function useThemePreference(): ThemePreference {
  return useThemePreferenceStore((state) => state.preference);
}

/**
 * Native controls (date picker, alerts, keyboard, status bar) take their appearance from the OS,
 * so an explicit choice overrides it for the app.
 */
export function applyNativeColorScheme(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

/** Switches the theme right away and remembers it. */
export function setThemePreference(preference: ThemePreference) {
  useThemePreferenceStore.setState({ preference });
  if (preference === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true);
  } else {
    // setTheme throws while adaptive themes are on.
    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme(preference);
  }
  applyNativeColorScheme(preference);
}
