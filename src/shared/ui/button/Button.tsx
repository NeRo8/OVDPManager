import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography, type TypographyTone } from '../typography/Typography';

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
