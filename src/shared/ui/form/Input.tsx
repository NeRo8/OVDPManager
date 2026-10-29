import { useState } from 'react';
import { type StyleProp, type TextInputProps, type TextStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { typography } from '@/shared/theme';

import { ThemedTextInput } from './ThemedTextInput';

const types = {
  text: { keyboardType: 'default', sanitize: (text: string) => text },
  decimal: {
    keyboardType: 'decimal-pad',
    sanitize: (text: string) => text.replace(/[^\d\s ,.]/g, ''),
  },
  integer: { keyboardType: 'number-pad', sanitize: (text: string) => text.replace(/\D/g, '') },
} as const;

/**
 * `field` fills a section row, `inline` is a right-aligned outlined box inside a FieldRow (its
 * outline turns `accent` while typing), `area` is multiline text such as pasted JSON.
 */
export type InputVariant = 'field' | 'inline' | 'area';

export type InputProps = Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'keyboardType' | 'multiline'
> & {
  variant?: InputVariant;
  /** Numeric types pick the matching keypad and drop characters that cannot be typed there */
  type?: keyof typeof types;
  style?: StyleProp<TextStyle>;
};

export function Input({
  variant = 'field',
  type = 'text',
  onChangeText,
  onFocus,
  onBlur,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { keyboardType, sanitize } = types[type];
  styles.useVariants({ variant });

  const focus: InputProps['onFocus'] = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };
  const blur: InputProps['onBlur'] = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <ThemedTextInput
      {...props}
      onChangeText={onChangeText && ((text) => onChangeText(sanitize(text)))}
      onFocus={focus}
      onBlur={blur}
      keyboardType={keyboardType}
      multiline={variant === 'area'}
      style={[styles.input, variant === 'inline' && isFocused && styles.focused, style]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  input: {
    color: theme.text,
    variants: {
      variant: {
        field: {
          ...typography.body,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          fontVariant: ['tabular-nums'],
        },
        inline: {
          ...typography.body,
          textAlign: 'right',
          minWidth: 80,
          minHeight: 36,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.sm,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.fieldBorder,
          backgroundColor: theme.muted,
          fontVariant: ['tabular-nums'],
        },
        area: {
          ...typography.caption1,
          fontFamily: 'monospace',
          minHeight: 120,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          textAlignVertical: 'top',
        },
      },
    },
  },
  focused: { borderColor: theme.accent },
}));
