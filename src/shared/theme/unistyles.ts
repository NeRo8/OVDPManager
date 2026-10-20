import { StyleSheet } from 'react-native-unistyles';

import { dark, light } from './palette';

const themes = { light, dark };

type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
  // The library uses an empty interface for theme augmentation.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({ themes, settings: { adaptiveThemes: true } });
