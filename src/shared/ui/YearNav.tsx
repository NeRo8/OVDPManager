import { Pressable, StyleSheet, View } from 'react-native';

import { themeStyles } from '@/shared/theme';
import { Typography } from './typography/Typography';

/** ‹ 2026 › switcher. */
export function YearNav({
  year,
  min,
  max,
  onChange,
}: {
  year: number;
  min: number;
  max: number;
  onChange: (year: number) => void;
}) {
  return (
    <View style={styles.nav}>
      <YearArrow
        label="‹"
        accessibilityLabel="Попередній рік"
        disabled={year <= min}
        onPress={() => onChange(year - 1)}
      />
      <Typography variant="title2" tabular align="center" style={styles.year}>
        {year}
      </Typography>
      <YearArrow
        label="›"
        accessibilityLabel="Наступний рік"
        disabled={year >= max}
        onPress={() => onChange(year + 1)}
      />
    </View>
  );
}

function YearArrow({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = themeStyles;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.arrow,
        theme.card,
        disabled ? styles.disabled : pressed && styles.pressed,
      ]}
    >
      <Typography variant="title1" tone="accent" style={styles.arrowText}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  year: { minWidth: 72 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  arrowText: { lineHeight: 28 },
});
