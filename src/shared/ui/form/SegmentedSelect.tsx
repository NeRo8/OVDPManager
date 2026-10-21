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
  group: { flexDirection: 'row', borderRadius: 10, padding: 3, backgroundColor: theme.muted },
  option: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  selected: {
    backgroundColor: theme.card,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  pressed: { opacity: 0.7 },
}));
