import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  children: ReactNode;
};

/** Padded summary card: a headline figure with its details. */
export function Card({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    boxShadow: theme.shadowCard,
    padding: theme.space.lg,
    gap: theme.space.xs,
    backgroundColor: theme.card,
  },
}));
