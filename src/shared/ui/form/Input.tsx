import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { themeStyles, typography, useColors } from '@/shared/theme';

const variants = StyleSheet.create({
  /** Full-width field filling a section row */
  field: {
    ...typography.body,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
  },
  /** Right-aligned value inside an InfoRow */
  inline: {
    ...typography.body,
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  /** Multiline text such as pasted JSON */
  area: {
    ...typography.caption1,
    fontFamily: 'monospace',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});

const types = {
  text: { keyboardType: 'default', sanitize: (text: string) => text },
  decimal: {
    keyboardType: 'decimal-pad',
    sanitize: (text: string) => text.replace(/[^\d\s ,.]/g, ''),
  },
  integer: { keyboardType: 'number-pad', sanitize: (text: string) => text.replace(/\D/g, '') },
} as const;

export type InputProps = Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'keyboardType' | 'multiline'
> & {
  variant?: keyof typeof variants;
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
  const colors = useColors();
  const { keyboardType, sanitize } = types[type];

  return (
    <TextInput
      {...props}
      onChangeText={onChangeText && ((text) => onChangeText(sanitize(text)))}
      keyboardType={keyboardType}
      multiline={variant === 'area'}
      placeholderTextColor={colors.secondaryText}
      style={[variants[variant], themeStyles.text, style]}
    />
  );
}
