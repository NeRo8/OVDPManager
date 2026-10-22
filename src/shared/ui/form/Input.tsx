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
 * `field` fills a section row, `inline` is a right-aligned value inside an InfoRow, `area` is
 * multiline text such as pasted JSON.
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
  style,
  ...props
}: InputProps) {
  const { keyboardType, sanitize } = types[type];
  styles.useVariants({ variant });

  return (
    <ThemedTextInput
      {...props}
      onChangeText={onChangeText && ((text) => onChangeText(sanitize(text)))}
      keyboardType={keyboardType}
      multiline={variant === 'area'}
      style={[styles.input, style]}
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
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontVariant: ['tabular-nums'],
        },
        inline: {
          ...typography.body,
          textAlign: 'right',
          minWidth: 80,
          paddingVertical: 4,
          fontVariant: ['tabular-nums'],
        },
        area: {
          ...typography.caption1,
          fontFamily: 'monospace',
          minHeight: 120,
          paddingHorizontal: 16,
          paddingVertical: 12,
          textAlignVertical: 'top',
        },
      },
    },
  },
}));
