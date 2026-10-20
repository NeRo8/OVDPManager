import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { themeStyles } from '@/shared/theme';

/** Padded summary card: a headline figure with its details. */
export function Card({ children }: { children: ReactNode }) {
  const theme = themeStyles;
  return <View style={[styles.card, theme.card]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
});
