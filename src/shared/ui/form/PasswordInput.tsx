import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { ThemedIcon } from '../icon/ThemedIcon';

import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'variant' | 'type' | 'secureTextEntry'>;

/** A section-row field for a secret, hidden by default; the eye on the right shows or hides it. */
export function PasswordInput({ style, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisible = () => setIsVisible((visible) => !visible);

  return (
    <View style={styles.row}>
      <Input {...props} secureTextEntry={!isVisible} style={[styles.input, style]} />
      <Pressable
        onPress={toggleVisible}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isVisible ? 'Сховати ключ' : 'Показати ключ'}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <ThemedIcon
          name={isVisible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          uniProps={(theme) => ({ color: theme.secondaryText })}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingRight: 0,
  },
  toggle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
  },
  pressed: { opacity: 0.6 },
}));
