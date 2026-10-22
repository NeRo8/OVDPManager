import type { SymbolViewProps } from 'expo-symbols';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedSymbolView } from './ThemedSymbolView';

export type HeaderButtonProps = {
  icon: SymbolViewProps['name'];
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  /** `neutral` for a toggle that is off, so the accent color marks it as on */
  tone?: 'accent' | 'neutral';
  /** Glyph size; circled symbols need more than the default to match plain ones */
  size?: number;
};

/** Icon-only header action; the label is announced by screen readers instead of shown. */
export function HeaderButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled,
  tone = 'accent',
  size = 20,
}: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.headerButton,
        disabled ? styles.disabled : pressed && styles.pressed,
      ]}
    >
      <ThemedSymbolView
        name={icon}
        size={size}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: tone === 'accent' ? theme.accent : theme.text })}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  headerButton: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
