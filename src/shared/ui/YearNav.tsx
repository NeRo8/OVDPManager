import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeStyles } from '@/shared/theme';

/**
 * ‹ 2026 › switcher. `compact` fits a settings row inside a card, so its arrows take the muted
 * fill instead of the card one.
 */
export function YearNav({
  year,
  min,
  max,
  onChange,
  compact,
}: {
  year: number;
  min: number;
  max: number;
  onChange: (year: number) => void;
  compact?: boolean;
}) {
  const theme = themeStyles;
  return (
    <View style={[styles.nav, compact && styles.navCompact]}>
      <YearArrow
        label="‹"
        accessibilityLabel="Попередній рік"
        disabled={year <= min}
        onPress={() => onChange(year - 1)}
        compact={compact}
      />
      <Text style={[styles.year, compact && styles.yearCompact, theme.text]}>{year}</Text>
      <YearArrow
        label="›"
        accessibilityLabel="Наступний рік"
        disabled={year >= max}
        onPress={() => onChange(year + 1)}
        compact={compact}
      />
    </View>
  );
}

function YearArrow({
  label,
  accessibilityLabel,
  disabled,
  onPress,
  compact,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
  compact?: boolean;
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
        compact && styles.arrowCompact,
        compact ? theme.muted : theme.card,
        disabled ? styles.disabled : pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.arrowText, compact && styles.arrowTextCompact, theme.accentText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  navCompact: { gap: 8 },
  year: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'center',
  },
  yearCompact: { fontSize: 17, fontWeight: '500', minWidth: 48 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCompact: { width: 32, height: 32, borderRadius: 16 },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  arrowText: { fontSize: 24, fontWeight: '500', lineHeight: 28 },
  arrowTextCompact: { fontSize: 20, lineHeight: 24 },
});
