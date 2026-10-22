import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

type Option<T extends string | number> = { label: string; value: T };

export type SegmentedSelectProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedSelect<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedSelectProps<T>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Typography
              variant="footnote"
              weight="semibold"
              align="center"
              tone={selected ? 'accent' : 'primary'}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Track and thumb radii stay concentric: md = sm + the track's xs padding.
  group: {
    flexDirection: 'row',
    borderRadius: theme.radius.md,
    padding: theme.space.xs,
    backgroundColor: theme.muted,
  },
  option: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    paddingHorizontal: theme.space.sm,
  },
  selected: {
    backgroundColor: theme.card,
    boxShadow: theme.shadowCard,
  },
  pressed: { opacity: 0.7 },
}));
