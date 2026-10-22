import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type InfoRowProps = {
  label: string;
  value: ReactNode;
};

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Typography variant="subhead" tone="secondary">
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="subhead" weight="medium" style={styles.value} selectable>
          {value}
        </Typography>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  value: { flexShrink: 1, textAlign: 'right' },
}));
