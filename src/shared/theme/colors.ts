import { StyleSheet, useUnistyles } from 'react-native-unistyles';

/** Used for values passed to navigation and native controls, which cannot take a style. */
export function useColors() {
  return useUnistyles().theme;
}

/** Theme styles update in place through the Unistyles Babel transform. */
export const themeStyles = StyleSheet.create((theme) => ({
  background: { backgroundColor: theme.background },
  card: { backgroundColor: theme.card },
  muted: { backgroundColor: theme.muted },
  borderBackground: { backgroundColor: theme.border },
  accentBackground: { backgroundColor: theme.accent },
  text: { color: theme.text },
  secondaryText: { color: theme.secondaryText },
  accentText: { color: theme.accent },
  accentOnText: { color: theme.accentText },
  positiveText: { color: theme.positive },
  dangerText: { color: theme.danger },
}));
