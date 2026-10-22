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
      {/* Half a phone width: long amounts shrink instead of wrapping. */}
      <Typography variant="title2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Typography>
      <View style={styles.tileDetails}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    gap: 2,
    backgroundColor: theme.card,
  },
  tileDetails: { gap: 6, marginTop: 8 },
}));
