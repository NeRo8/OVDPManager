import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type SeriesColor } from '@/shared/theme';
import { Typography } from '../typography/Typography';
import { Swatch } from './Swatch';

export type LegendRowProps = {
  color: SeriesColor;
  label: string;
  value: string;
};

/** Swatch + name + amount: the chart legend doubles as the breakdown of the total. */
export function LegendRow({ color, label, value }: LegendRowProps) {
  return (
    <View style={styles.legendRow}>
      <Swatch color={color} />
      <Typography variant="footnote" tone="secondary" style={styles.legendLabel}>
        {label}
      </Typography>
      <Typography variant="footnote" weight="semibold" tabular>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendLabel: { flex: 1 },
});
