import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

type Props = {
  label: string;
  /** Shown under the row while the value is invalid */
  error?: string;
  /** The control on the right: an inline input, a date field */
  children: ReactNode;
};

/** A form row inside a section: label on the left, control on the right, its error below. */
export function FieldRow({ label, error, children }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <Typography variant="subhead" tone="secondary">
          {label}
        </Typography>
        {children}
      </View>
      {error && (
        <Typography
          variant="caption1"
          tone="danger"
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Typography>
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
  error: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.md,
    marginTop: -theme.space.xs,
  },
}));
