import { useThemePreferenceStore } from './store';
import type { ThemePreference } from './types';

export function useThemePreference(): ThemePreference {
  return useThemePreferenceStore((state) => state.preference);
}

export function getThemePreference(): ThemePreference {
  return useThemePreferenceStore.getState().preference;
}
