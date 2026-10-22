import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from './typography/Typography';
import { YearArrow } from './YearArrow';

export type YearNavProps = {
  year: number;
  min: number;
  max: number;
  onChange: (year: number) => void;
};

/** ‹ 2026 › switcher. */
export function YearNav({ year, min, max, onChange }: YearNavProps) {
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

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  year: { minWidth: 72 },
});
