import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { Typography, type TypographyTone } from '../typography/Typography';

/** SF Symbol / Material icon whose tint follows the theme. */
export const ThemedSymbolView = withUnistyles(SymbolView);

export type HeaderButtonProps = {
  icon: SymbolViewProps['name'];
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  /** `neutral` for a toggle that is off, so the accent color marks it as on */
  tone?: 'accent' | 'neutral';
  /** Glyph size; circled symbols need more than the default to match plain ones */
  size?: number;
};

/** Icon-only header action; the label is announced by screen readers instead of shown. */
export function HeaderButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled,
  tone = 'accent',
  size = 20,
}: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.headerButton,
        disabled ? styles.disabled : pressed && styles.pressed,
      ]}
    >
      <ThemedSymbolView
        name={icon}
        size={size}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: tone === 'accent' ? theme.accent : theme.text })}
      />
    </Pressable>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

const TITLE_TONES = {
  primary: 'onAccent',
  secondary: 'accent',
  destructive: 'danger',
} as const satisfies Record<ButtonVariant, TypographyTone>;

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  styles.useVariants({ variant });
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : pressed && styles.pressed,
        style,
      ]}
    >
      <Typography variant="headline" tone={TITLE_TONES[variant]}>
        {title}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  headerButton: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    variants: {
      variant: {
        primary: { backgroundColor: theme.accent },
        secondary: { backgroundColor: theme.card },
        destructive: { backgroundColor: theme.card },
      },
    },
  },
}));
