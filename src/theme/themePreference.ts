import { Appearance } from 'react-native';

import { UnistylesRuntime } from 'react-native-unistyles';

import { setPreferredTheme, type ThemePreference } from '@/stores/appSettings';

/**
 * Native controls (date picker, alerts, keyboard, status bar) take their appearance from the OS,
 * so an explicit choice overrides it for the app.
 */
export function applyNativeColorScheme(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

/** Switches the theme right away and remembers it. */
export function setThemePreference(preference: ThemePreference): void {
  setPreferredTheme(preference);
  if (preference === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true);
  } else {
    // setTheme throws while adaptive themes are on.
    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme(preference);
  }
  applyNativeColorScheme(preference);
}
