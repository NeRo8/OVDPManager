import { useState } from 'react';

import { parseAmount } from '@/shared/lib';
import { Input, type InputProps } from './Input';

type NumberInputProps = Omit<InputProps, 'value' | 'onChange' | 'onChangeText' | 'type'> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

/** Keeps intermediate decimal input such as "16," while reporting valid numbers. */
export function NumberInput({ value, onChange, variant = 'inline', ...props }: NumberInputProps) {
  const [text, setText] = useState(value === null ? '' : String(value).replace('.', ','));

  function onChangeText(next: string) {
    setText(next);
    const parsed = parseAmount(next);
    if (next.trim() === '') onChange(null);
    else if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  }

  return (
    <Input {...props} variant={variant} type="decimal" value={text} onChangeText={onChangeText} />
  );
}
