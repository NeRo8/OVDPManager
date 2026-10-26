import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { SignedValue } from '../typography/SignedValue';
import { Typography } from '../typography/Typography';

export type InfoRowProps = {
  label: string;
  /** A short explanation of what the value means, on its own line under the row */
  hint?: string;
  value: ReactNode;
  /** When present, the numeric result determines the value color. */
  signedValue?: number;
};

export function InfoRow({ label, hint, value, signedValue }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Typography variant="subhead" tone="secondary">
          {label}
        </Typography>
        {typeof value === 'string' ? (
          signedValue === undefined ? (
            <Typography variant="subhead" weight="medium" style={styles.value} selectable>
              {value}
            </Typography>
          ) : (
            <SignedValue
              value={signedValue}
              variant="subhead"
              weight="medium"
              style={styles.value}
              selectable
            >
              {value}
            </SignedValue>
          )
        ) : (
          value
        )}
      </View>
      {hint && (
        <Typography variant="caption1" tone="secondary">
          {hint}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: 'center',
    gap: theme.space.xxs,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  value: { flexShrink: 1, textAlign: 'right' },
}));
