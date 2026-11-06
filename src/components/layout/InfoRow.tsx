import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';
import { SkeletonGroup } from '@/components/skeleton/SkeletonGroup';
import { SignedValue } from '@/components/typography/SignedValue';
import { Typography } from '@/components/typography/Typography';

export type InfoRowProps = {
  label: string;
  /** A short explanation of what the value means, on its own line under the row */
  hint?: string;
  /**
   * Text: a string, or text components such as `Percent`, which take the row's value style.
   * Ignored while `loadingLabel` is set.
   */
  value?: ReactNode;
  /** When present, the numeric result determines the value color. */
  signedValue?: number;
  /** While set, a skeleton bar stands in for the value; screen readers read this instead. */
  loadingLabel?: string;
  /** Give the value room by wrapping the label first. */
  prioritizeValue?: boolean;
};

function renderValue({ value, signedValue, loadingLabel, prioritizeValue }: InfoRowProps) {
  if (loadingLabel) {
    return (
      <SkeletonGroup label={loadingLabel}>
        <SkeletonBlock width={120} height={14} />
      </SkeletonGroup>
    );
  }
  if (signedValue !== undefined) {
    return (
      <SignedValue
        value={signedValue}
        variant="subhead"
        weight="medium"
        style={[styles.value, prioritizeValue && styles.priorityValue]}
        selectable
      >
        {value}
      </SignedValue>
    );
  }
  return (
    <Typography
      variant="subhead"
      weight="medium"
      style={[styles.value, prioritizeValue && styles.priorityValue]}
      selectable
    >
      {value}
    </Typography>
  );
}

export function InfoRow(props: InfoRowProps) {
  const { label, hint, prioritizeValue } = props;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Typography variant="subhead" tone="secondary" style={prioritizeValue && styles.label}>
          {label}
        </Typography>
        {renderValue(props)}
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
  label: { flexShrink: 1 },
  priorityValue: { flexShrink: 0, maxWidth: '60%' },
}));
