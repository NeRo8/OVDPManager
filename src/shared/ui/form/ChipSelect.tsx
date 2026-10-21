import type { SymbolViewProps } from 'expo-symbols';
import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedSymbolView } from '../button/Button';
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

type Option<T extends string | number> = { label: string; value: T };

export type ChipSelectProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Rendered after the options, e.g. a chip with another setting */
  children?: React.ReactNode;
};

/** One choice from a row of chips that scrolls sideways, edge to edge. */
export function ChipSelect<T extends string | number>({
  options,
  value,
  onChange,
  children,
}: ChipSelectProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.rowContent}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Out to the screen edges, so chips scroll under them instead of being cut at the padding.
  row: { marginHorizontal: -16, flexGrow: 0 },
  rowContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderCurve: 'continuous',
    variants: {
      selected: {
        true: { backgroundColor: theme.accent },
        false: { backgroundColor: theme.card },
      },
    },
  },
  pressed: { opacity: 0.7 },
}));
