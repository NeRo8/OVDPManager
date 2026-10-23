import { StyleSheet } from 'react-native-unistyles';

import { dark, light } from './palette';
import { applyNativeColorScheme, getThemePreference } from './themePreference';
import { radius, space } from './tokens';

// Spacing and radii are the same in both themes; living in the theme, they reach every stylesheet.
const themes = {
  light: { ...light, space, radius },
  dark: { ...dark, space, radius },
};

type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
  // The library uses an empty interface for theme augmentation.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

const preference = getThemePreference();

StyleSheet.configure({
  themes,
  // initialTheme and adaptiveThemes are mutually exclusive.
  settings: preference === 'system' ? { adaptiveThemes: true } : { initialTheme: preference },
});
applyNativeColorScheme(preference);
