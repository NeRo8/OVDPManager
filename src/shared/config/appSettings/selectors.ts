import { useAppSettingsStore } from './store';
import type { ThemePreference } from './types';

export function useThemePreference(): ThemePreference {
  return useAppSettingsStore((state) => state.preference);
}

export function getThemePreference(): ThemePreference {
  return useAppSettingsStore.getState().preference;
}

export function useToday(): string {
  return useAppSettingsStore((state) => state.today);
}
