import { StyleSheet, Text, type TextProps } from 'react-native';

import {
  fontWeights,
  themeStyles,
  typography,
  type FontWeight,
  type TypographyVariant,
} from '@/shared/theme';

const toneStyles = {
  primary: 'text',
  secondary: 'secondaryText',
  accent: 'accentText',
  onAccent: 'accentOnText',
  positive: 'positiveText',
  danger: 'dangerText',
} as const satisfies Record<string, keyof typeof themeStyles>;

export type TypographyTone = keyof typeof toneStyles;

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
  const theme = themeStyles;
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        theme[toneStyles[tone]],
        weight && { fontWeight: fontWeights[weight] },
        tabular && styles.tabular,
        align && { textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
