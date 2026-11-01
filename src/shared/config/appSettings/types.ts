/** `system` follows the device's light or dark appearance. */
export type ThemePreference = 'system' | 'light' | 'dark';

export type AppSettingsState = {
  preference: ThemePreference;
  /** Current local calendar date, refreshed when the app opens. */
  today: string;
};
