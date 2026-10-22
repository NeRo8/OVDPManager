import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type ActionRowProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

/** A section row that does something in place, unlike LinkRow, which opens another screen. */
export function ActionRow({ title, onPress, disabled }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, disabled ? styles.disabled : pressed && styles.pressed]}
    >
      <Typography variant="body" tone="accent">
        {title}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  pressed: { backgroundColor: theme.muted },
  disabled: { opacity: 0.4 },
}));
