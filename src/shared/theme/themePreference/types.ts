/** `system` follows the device's light or dark appearance. */
export type ThemePreference = 'system' | 'light' | 'dark';

export type ThemePreferenceState = {
  preference: ThemePreference;
};
