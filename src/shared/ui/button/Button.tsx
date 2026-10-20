import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { themeStyles } from '@/shared/theme';

export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = themeStyles;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
    >
      <Text style={[styles.headerButtonText, theme.accentText]}>{title}</Text>
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
      <Text
        style={[
          styles.buttonText,
          isPrimary
            ? theme.accentOnText
            : variant === 'destructive'
              ? theme.dangerText
              : theme.accentText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  headerButton: { paddingHorizontal: 0 },
  headerButtonText: { fontSize: 17, fontWeight: '500' },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
});
