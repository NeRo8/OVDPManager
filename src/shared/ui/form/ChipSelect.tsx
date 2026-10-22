import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Chip } from './Chip';

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
  row: { marginHorizontal: -theme.space.lg, flexGrow: 0 },
  rowContent: { paddingHorizontal: theme.space.lg, gap: theme.space.sm },
}));
