import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/components/typography/Typography';
import type { SeriesColor } from '@/theme/series';

import { Swatch } from './Swatch';

export type LegendRowProps = {
  color: SeriesColor;
  label: string;
  /** Text, such as `Money`; without it the row only names its series */
  value?: ReactNode;
};

/** Swatch + name + amount: the chart legend doubles as the breakdown of the total. */
export function LegendRow({ color, label, value }: LegendRowProps) {
  return (
    <View style={styles.legendRow}>
      <Swatch color={color} />
      <Typography variant="footnote" tone="secondary" style={styles.legendLabel}>
        {label}
      </Typography>
      {value !== undefined && (
        <Typography variant="footnote" weight="semibold" tabular>
          {value}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  legendLabel: { flex: 1 },
}));
