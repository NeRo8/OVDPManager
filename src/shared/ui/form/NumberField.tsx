import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { parseAmount } from '@/shared/lib';
import { useColors, themeStyles } from '@/shared/theme';

/** Keeps intermediate decimal input such as "16," while reporting valid numbers. */
export function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
}) {
  const colors = useColors();
  const theme = themeStyles;
  const [text, setText] = useState(value === null ? '' : String(value).replace('.', ','));

  function onChangeText(next: string) {
    setText(next);
    const parsed = parseAmount(next);
    if (next.trim() === '') onChange(null);
    else if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  }

  return (
    <TextInput
      value={text}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.secondaryText}
      keyboardType="decimal-pad"
      style={[styles.input, theme.text]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 17,
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
  },
});
