import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography, type TypographyTone } from '../typography/Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'plain' | 'destructive';

const TITLE_TONES = {
  primary: 'onAccent',
  secondary: 'accent',
  plain: 'accent',
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
  button: {
    minHeight: 50,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      variant: {
        primary: { backgroundColor: theme.accentFill },
        // Card-colored buttons lift off the background like the cards around them.
        secondary: { backgroundColor: theme.card, boxShadow: theme.shadowCard },
        // A minor choice next to a primary button, such as skipping a step.
        plain: { backgroundColor: 'transparent' },
        destructive: { backgroundColor: theme.card, boxShadow: theme.shadowCard },
      },
    },
  },
}));
