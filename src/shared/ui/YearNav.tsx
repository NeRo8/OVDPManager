import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeStyles } from '@/shared/theme';

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
  const theme = themeStyles;
  return (
    <View style={styles.nav}>
      <YearArrow
        label="‹"
        accessibilityLabel="Попередній рік"
        disabled={year <= min}
        onPress={() => onChange(year - 1)}
      />
      <Text style={[styles.year, theme.text]}>{year}</Text>
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
      <Text style={[styles.arrowText, theme.accentText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  year: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'center',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  arrowText: { fontSize: 24, fontWeight: '500', lineHeight: 28 },
});
