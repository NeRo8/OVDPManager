import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { themeStyles } from '@/shared/theme';
import { Typography } from '../typography/Typography';

export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
    >
      <Typography tone="accent" weight="medium">
        {title}
      </Typography>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const theme = themeStyles;
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        isPrimary ? theme.accentBackground : theme.card,
        disabled ? styles.disabled : pressed && styles.pressed,
        style,
      ]}
    >
      <Typography
        variant="headline"
        tone={isPrimary ? 'onAccent' : variant === 'destructive' ? 'danger' : 'accent'}
      >
        {title}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  headerButton: { paddingHorizontal: 0 },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
});
