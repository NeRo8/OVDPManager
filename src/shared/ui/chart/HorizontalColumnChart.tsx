import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Canvas, Rect, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native-unistyles';

import { formatCompact } from '@/shared/lib';

import { Typography } from '../typography/Typography';

import { formatGridTick } from './chartGrid';
import type { ChartPalette } from './chartTheme';
import {
  type ChartColumn,
  type ChartSeries,
  type ChartValueFormat,
  columnStacks,
  describeColumn,
} from './columnStacks';

const ROW_HEIGHT = 40;
const BAR_HEIGHT = 16;
const PLOT_INSET = 2;
const SEGMENT_GAP = 2;
const MIN_SEGMENT = 3;
const TICK_WIDTH = 52;

type Props = {
  columns: ChartColumn[];
  series: ChartSeries[];
  currency: string;
  valueFormat: ChartValueFormat;
  selected: number | null;
  onSelect?: (column: number) => void;
  palette: ChartPalette;
};

/** Horizontal form of the same stacked scale used by ColumnChart. */
export function HorizontalColumnChart({
  columns,
  series,
  currency,
  valueFormat,
  selected,
  onSelect,
  palette,
}: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const { up, down, upTotals, downTotals, grid } = columnStacks(columns, series);
  const plotHeight = columns.length * ROW_HEIGHT;
  const unit = Math.max(0, plotWidth - PLOT_INSET * 2) / (grid.max - grid.min);
  const xOf = (value: number) => PLOT_INSET + (value - grid.min) * unit;
  const baseline = xOf(0);
  const formatShort = (value: number) =>
    valueFormat === 'percent'
      ? `${formatGridTick(value, grid.step)} %`
      : value < 0
        ? `−${formatCompact(-value)}`
        : formatCompact(value);

  return (
    <View style={styles.chart}>
      <View style={styles.names}>
        {columns.map(({ label }, index) => (
          <Typography
            key={index}
            variant="caption2"
            tone={selected === index ? 'primary' : 'secondary'}
            weight={selected === index ? 'semibold' : undefined}
            numberOfLines={2}
            style={styles.name}
          >
            {label}
          </Typography>
        ))}
      </View>
      <View style={styles.plotColumn}>
        <View
          style={{ height: plotHeight }}
          onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}
        >
          {plotWidth > 0 && (
            <Canvas style={styles.canvas}>
              {grid.ticks.map((tick) => (
                <Rect
                  key={tick}
                  x={xOf(tick)}
                  y={0}
                  width={StyleSheet.hairlineWidth}
                  height={plotHeight}
                  color={tick === 0 ? palette.border : palette.grid}
                />
              ))}
              {columns.map((_, index) => {
                const y = index * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                let right = baseline;
                let left = baseline;
                return [
                  ...up
                    .filter((item) => item.values[index] > 0)
                    .map((item, part) => {
                      right += part > 0 ? SEGMENT_GAP : 0;
                      const width = Math.min(
                        Math.max(item.values[index] * unit, MIN_SEGMENT),
                        Math.max(0, plotWidth - right),
                      );
                      const x = right;
                      right += width;
                      return (
                        <RoundedRect
                          key={`${index}-up-${item.color}`}
                          x={x}
                          y={y}
                          width={width}
                          height={BAR_HEIGHT}
                          r={2}
                          color={palette.marks[item.color]}
                        />
                      );
                    }),
                  ...down
                    .filter((item) => item.values[index] > 0)
                    .map((item, part) => {
                      left -= part > 0 ? SEGMENT_GAP : 0;
                      const width = Math.min(
                        Math.max(item.values[index] * unit, MIN_SEGMENT),
                        Math.max(0, left),
                      );
                      left -= width;
                      return (
                        <RoundedRect
                          key={`${index}-down-${item.color}`}
                          x={left}
                          y={y}
                          width={width}
                          height={BAR_HEIGHT}
                          r={2}
                          color={palette.marks[item.color]}
                        />
                      );
                    }),
                ];
              })}
            </Canvas>
          )}
          <View style={styles.slots}>
            {columns.map((column, index) => {
              const select = onSelect && (() => onSelect(index));
              return (
                <Pressable
                  key={index}
                  disabled={!select}
                  onPress={select}
                  accessibilityRole={select ? 'button' : 'text'}
                  accessibilityLabel={describeColumn(column, index, series, valueFormat, currency)}
                  accessibilityState={select && { selected: selected === index }}
                  style={styles.slot}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.axis}>
          {plotWidth > 0 &&
            grid.ticks
              .filter((tick) => tick === grid.min || tick === 0 || tick === grid.max)
              .map((tick) => (
                <Typography
                  key={tick}
                  variant="caption2"
                  tone="secondary"
                  tabular
                  numberOfLines={1}
                  align="center"
                  style={[
                    styles.tick,
                    {
                      left: Math.max(
                        0,
                        Math.min(plotWidth - TICK_WIDTH, xOf(tick) - TICK_WIDTH / 2),
                      ),
                    },
                  ]}
                >
                  {formatShort(tick)}
                </Typography>
              ))}
        </View>
      </View>
      <View style={styles.values}>
        {columns.map((_, index) => {
          const positive = upTotals[index];
          const negative = downTotals[index];
          return (
            <Typography
              key={index}
              variant="caption2"
              weight="semibold"
              tabular
              align="right"
              numberOfLines={1}
              style={styles.value}
            >
              {positive > 0 && negative > 0 ? '' : formatShort(positive > 0 ? positive : -negative)}
            </Typography>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chart: { flexDirection: 'row', gap: theme.space.xs },
  names: { width: 78 },
  name: { height: ROW_HEIGHT, textAlignVertical: 'center' },
  plotColumn: { flex: 1 },
  canvas: { flex: 1 },
  slots: { position: 'absolute', inset: 0 },
  slot: { height: ROW_HEIGHT },
  axis: { height: 20 },
  tick: { position: 'absolute', width: TICK_WIDTH },
  values: { width: 68 },
  value: { height: ROW_HEIGHT, textAlignVertical: 'center' },
}));
