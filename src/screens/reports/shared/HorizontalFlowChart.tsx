import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { formatGridTick } from '@/components/chart/chartGrid';
import { describeColumn } from '@/components/chart/columnStacks';
import { LegendRow } from '@/components/chart/LegendRow';
import { Card } from '@/components/layout/Card';
import { Typography } from '@/components/typography/Typography';
import { SERIES_COLORS, type SeriesColor } from '@/theme/series';

import { flowChartData, horizontalFlowStacks, type FlowPeriod } from './flowChartData';

type Props = { currency: string; periods: FlowPeriod[] };

export function HorizontalFlowChart({ currency, periods }: Props) {
  const { columns, series } = flowChartData(periods, true);
  const { up, down, grid } = horizontalFlowStacks(columns, series);
  const negative = -grid.min;
  const positive = grid.max;

  return (
    <Card title={`Рух грошей · ${currency}`}>
      <View style={styles.axisRow}>
        <View style={styles.label} />
        <View style={styles.axis}>
          {negative > 0 && (
            <View style={{ flex: negative }}>
              <Typography variant="caption2" tone="secondary">
                {formatGridTick(grid.min, grid.step)}
              </Typography>
            </View>
          )}
          <Typography
            variant="caption2"
            tone="secondary"
            style={[styles.zero, { left: `${(negative / (negative + positive)) * 100}%` }]}
          >
            0
          </Typography>
          {positive > 0 && (
            <View style={{ flex: positive }}>
              <Typography variant="caption2" tone="secondary" align="right">
                {formatGridTick(grid.max, grid.step)}
              </Typography>
            </View>
          )}
        </View>
      </View>
      {columns.map((column, index) => (
        <View
          key={column.name}
          style={styles.row}
          accessible
          accessibilityLabel={describeColumn(column, index, series, currency)}
        >
          <Typography variant="caption2" tone="secondary" style={styles.label}>
            {column.label}
          </Typography>
          <View style={styles.plot}>
            {negative > 0 && (
              <View style={[styles.negative, { flex: negative }]}>
                {down.map((item) => (
                  <View
                    key={item.color}
                    style={styles.segment(item.color, Math.max(0, item.values[index]) / negative)}
                  />
                ))}
              </View>
            )}
            {positive > 0 && (
              <View style={[styles.positive, { flex: positive }]}>
                {up.map((item) => (
                  <View
                    key={item.color}
                    style={styles.segment(item.color, Math.max(0, item.values[index]) / positive)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
      {series.map((item) => (
        <LegendRow key={item.color} color={item.color} label={item.label} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  axisRow: { flexDirection: 'row', alignItems: 'center' },
  label: { width: 62 },
  axis: { flex: 1, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  zero: { position: 'absolute', marginLeft: -3 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  plot: { flex: 1, flexDirection: 'row', height: 18 },
  negative: {
    flexDirection: 'row-reverse',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  positive: {
    flexDirection: 'row',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  segment: (color: SeriesColor, fraction: number) => ({
    width: `${fraction * 100}%` as const,
    height: '100%' as const,
    backgroundColor: theme[SERIES_COLORS[color].mark],
  }),
}));
