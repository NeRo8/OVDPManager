import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography, type TypographyTone } from '../typography/Typography';

export type ActionRowProps = {
  title: string;
  onPress: () => void;
  /** `danger` for an action that removes data */
  tone?: Extract<TypographyTone, 'accent' | 'danger'>;
  disabled?: boolean;
};

/** A section row that does something in place, unlike LinkRow, which opens another screen. */
export function ActionRow({ title, onPress, tone = 'accent', disabled }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, disabled ? styles.disabled : pressed && styles.pressed]}
    >
      <Typography variant="body" tone={tone}>
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
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  pressed: { backgroundColor: theme.muted },
  disabled: { opacity: 0.4 },
}));
