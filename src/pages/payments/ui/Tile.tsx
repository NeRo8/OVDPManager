import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

type TileProps = {
  label: string;
  value: string;
  children: ReactNode;
};

export function Tile({ label, value, children }: TileProps) {
  return (
    <View style={styles.tile}>
      <Typography variant="overline" tone="secondary">
        {label}
      </Typography>
      <Typography variant="title2">{value}</Typography>
      <View style={styles.tileDetails}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    boxShadow: theme.shadowCard,
    padding: theme.space.lg,
    gap: theme.space.xxs,
    backgroundColor: theme.card,
  },
  tileDetails: { gap: theme.space.sm, marginTop: theme.space.sm },
}));
