import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedIcon } from '../icon/ThemedIcon';
import { Typography } from '../typography/Typography';

export type CheckRowProps = {
  title: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
};

/** A section row that is switched on and off, marked with a check. */
export function CheckRow({ title, subtitle, checked, onPress }: CheckRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption1" tone="secondary">
            {subtitle}
          </Typography>
        )}
      </View>
      {checked && (
        <ThemedIcon name="checkmark" size={20} uniProps={(theme) => ({ color: theme.accent })} />
      )}
    </Pressable>
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
  rowText: { flexShrink: 1, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
}));
