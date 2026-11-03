import { useAppSettingsStore } from './store';
import type { ThemePreference, Toast } from './types';

export function useThemePreference(): ThemePreference {
  return useAppSettingsStore((state) => state.preference);
}

export function getThemePreference(): ThemePreference {
  return useAppSettingsStore.getState().preference;
}

export function useToday(): string {
  return useAppSettingsStore((state) => state.today);
}

export function useIsOnboardingCompleted(): boolean {
  return useAppSettingsStore((state) => state.isOnboardingCompleted);
}

export function useToast(): Toast | null {
  return useAppSettingsStore((state) => state.toast);
}
