import { Text, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { fontWeights, typography, type FontWeight, type TypographyVariant } from '@/shared/theme';

export type TypographyTone =
  'primary' | 'secondary' | 'accent' | 'onAccent' | 'positive' | 'danger';

export type TypographyProps = TextProps & {
  variant?: TypographyVariant;
  tone?: TypographyTone;
  /** Overrides the variant's weight */
  weight?: FontWeight;
  /** Fixed-width digits, so amounts and dates line up */
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
};

/** All text in the app goes through one of the typography variants. */
export function Typography({
  variant = 'body',
  tone = 'primary',
  weight,
  tabular,
  align,
  style,
  ...props
}: TypographyProps) {
  styles.useVariants({ variant, tone, weight, tabular, align });
  // Modifiers are a separate style so they always win over the variant's own weight.
  return <Text {...props} style={[styles.text, styles.modifiers, style]} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: typography,
      tone: {
        primary: { color: theme.text },
        secondary: { color: theme.secondaryText },
        accent: { color: theme.accent },
        onAccent: { color: theme.accentText },
        positive: { color: theme.positive },
        danger: { color: theme.danger },
      },
    },
  },
  modifiers: {
    variants: {
      weight: {
        regular: { fontWeight: fontWeights.regular },
        medium: { fontWeight: fontWeights.medium },
        semibold: { fontWeight: fontWeights.semibold },
        bold: { fontWeight: fontWeights.bold },
      },
      tabular: {
        true: { fontVariant: ['tabular-nums'] },
      },
      align: {
        left: { textAlign: 'left' },
        center: { textAlign: 'center' },
        right: { textAlign: 'right' },
      },
    },
  },
}));
