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
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 16,
    gap: 4,
    backgroundColor: theme.card,
  },
}));
