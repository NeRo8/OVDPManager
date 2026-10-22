import type { SymbolViewProps } from 'expo-symbols';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedSymbolView } from '../button/ThemedSymbolView';
import { Typography } from '../typography/Typography';

export type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
  accessibilityLabel?: string;
};

/** A compact pill for filters: filled with the accent color while selected. */
export function Chip({ label, selected = false, icon, onPress, accessibilityLabel }: ChipProps) {
  styles.useVariants({ selected });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      {icon && (
        <ThemedSymbolView
          name={icon}
          size={13}
          weight="semibold"
          uniProps={(theme) => ({ tintColor: selected ? theme.accentText : theme.text })}
        />
      )}
      <Typography variant="footnote" weight="semibold" tone={selected ? 'onAccent' : 'primary'}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    height: 34,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.full,
    variants: {
      selected: {
        true: { backgroundColor: theme.accent },
        false: { backgroundColor: theme.card, boxShadow: theme.shadowCard },
      },
    },
  },
  pressed: { opacity: 0.7 },
}));
