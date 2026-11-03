/** `system` follows the device's light or dark appearance. */
export type ThemePreference = 'system' | 'light' | 'dark';

export type ToastTone = 'error' | 'success' | 'info';

export type Toast = {
  tone: ToastTone;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
};

export type AppSettingsState = {
  preference: ThemePreference;
  /** Current local calendar date, refreshed when the app opens. */
  today: string;
  /** Whether the user has completed the onboarding flow. */
  isOnboardingCompleted: boolean;
  /** One toast at a time: a new one replaces the one on screen */
  toast: Toast | null;
};
