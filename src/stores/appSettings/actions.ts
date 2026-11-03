import { todayISO } from '@/utils/date';

import { useAppSettingsStore } from './store';
import type { ThemePreference, Toast } from './types';

export function setPreferredTheme(preference: ThemePreference): void {
  useAppSettingsStore.setState({ preference });
}

/** Takes the device's date as today; called when the app opens or comes back to the front. */
export function refreshToday(): void {
  useAppSettingsStore.setState({ today: todayISO() });
}

/** Marks the onboarding flow as completed. */
export function completeOnboarding(): void {
  useAppSettingsStore.setState({ isOnboardingCompleted: true });
}

/**
 * Tells the user about something that just happened (a failed request, a form that cannot be
 * saved, a finished action). One toast at a time: a new one replaces the one on screen.
 */
export function showToast(toast: Toast): void {
  useAppSettingsStore.setState({ toast });
}

export function hideToast(): void {
  useAppSettingsStore.setState({ toast: null });
}
