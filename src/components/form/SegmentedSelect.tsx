import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/components/typography/Typography';
import { space } from '@/theme/tokens';

type Option<T extends string | number> = { label: string; value: T };

export type SegmentedSelectProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** One choice out of a few, with a solid and legible selected segment on every platform. */
export function SegmentedSelect<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedSelectProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
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
              pressed && !selected && styles.pressed,
            ]}
          >
            <Typography
              variant="footnote"
              weight={selected ? 'semibold' : 'medium'}
              align="center"
              tone={selected ? 'onAccent' : 'secondary'}
              numberOfLines={1}
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
  track: {
    flexDirection: 'row',
    padding: space.xs,
    backgroundColor: theme.muted,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  selected: { backgroundColor: theme.accentFill },
  pressed: { opacity: 0.6 },
}));
