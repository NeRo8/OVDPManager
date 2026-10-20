import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { themeStyles, useColors } from '@/shared/theme';
import { Typography } from '../typography/Typography';

/** Icon-only header action; the label is announced by screen readers instead of shown. */
export function HeaderButton({
  icon,
  accessibilityLabel,
  onPress,
}: {
  icon: SymbolViewProps['name'];
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
    >
      <SymbolView name={icon} size={20} weight="semibold" tintColor={colors.accent} />
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
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
});
