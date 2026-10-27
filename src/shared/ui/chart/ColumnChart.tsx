import { useState, type ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Rect, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { formatCompact, formatMoney } from '@/shared/lib';
import type { SeriesColor } from '@/shared/theme';
import { Typography } from '../typography/Typography';
import { chartGrid, formatGridTick, gridBoundaries } from './chartGrid';
import { chartPalette, type ChartPalette } from './chartTheme';
import { HorizontalColumnChart } from './HorizontalColumnChart';

const PLOT_HEIGHT = 160;
const SPLIT_PLOT_HEIGHT = 200;
const PLOT_INSET = 8;
const AXIS_WIDTH = 52;
const VALUE_WIDTH = 72;
const LABEL_SPACE = 22;
const SEGMENT_GAP = 2;
const MIN_SEGMENT = 3;
const MAX_BAR_WIDTH = 24;

export type ChartSeries = {
  label: string;
  color: SeriesColor;
  values: number[];
  direction?: 'up' | 'down';
};

export type ChartColumn = {
  label: string;
  name: string;
};

type Props = {
  columns: ChartColumn[];
  series: ChartSeries[];
  currency: string;
  orientation?: 'vertical' | 'horizontal';
  valueFormat?: 'money' | 'percent';
  selected?: number | null;
  onSelect?: (column: number) => void;
};

type ThemedProps = Props & { palette: ChartPalette };

/** Stacked money in and money out on one scale, with accessible native labels and touch slots. */
function ColumnChartView({
  columns,
  series,
  currency,
  orientation = 'vertical',
  valueFormat = 'money',
  selected = null,
  onSelect,
  palette,
}: ThemedProps) {
  const [plotWidth, setPlotWidth] = useState(0);
  const up = series.filter((item) => item.direction !== 'down');
  const down = series.filter((item) => item.direction === 'down');
  const totals = (group: ChartSeries[]) =>
    columns.map((_, column) => group.reduce((sum, item) => sum + item.values[column], 0));
  const upTotals = totals(up);
  const downTotals = totals(down);
  const upMax = Math.max(0, ...upTotals);
  const downMax = Math.max(0, ...downTotals);
  const plotHeight = down.length ? SPLIT_PLOT_HEIGHT : PLOT_HEIGHT;
  const grid = chartGrid(-downMax, upMax);
  const unit = (plotHeight - PLOT_INSET * 2) / (grid.max - grid.min);
  const baseline = PLOT_INSET + grid.max * unit;
  const yOf = (value: number) => baseline - value * unit;
  const segments = (group: ChartSeries[], column: number) =>
    group
      .map((item) => ({ ...item, height: Math.max(item.values[column] * unit, MIN_SEGMENT) }))
      .filter((item) => item.values[column] > 0);
  const stackHeight = (group: ChartSeries[], column: number) => {
    const parts = segments(group, column);
    return (
      parts.reduce((sum, item) => sum + item.height, 0) +
      Math.max(0, parts.length - 1) * SEGMENT_GAP
    );
  };
  const slotWidth = columns.length ? plotWidth / columns.length : 0;
  const barWidth = Math.min(slotWidth * 0.62, MAX_BAR_WIDTH);
  const lastColumn = columns.length - 1;
  const labelPosition = (column: number) =>
    column === 0
      ? styles.valueStart
      : column === lastColumn
        ? styles.valueEnd
        : {
            left: `${((column + 0.5) / columns.length) * 100}%` as const,
            marginLeft: -VALUE_WIDTH / 2,
          };
  const labelAlign = (column: number) =>
    column === 0 ? 'left' : column === lastColumn ? 'right' : 'center';
  const formatValue = (value: number) =>
    valueFormat === 'percent'
      ? `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(value)} %`
      : formatMoney(value, currency);
  const formatTick = (value: number) =>
    `${formatGridTick(value, grid.step)}${valueFormat === 'percent' ? ' %' : ''}`;
  const formatSelected = (value: number) =>
    valueFormat === 'percent' ? formatTick(value) : formatCompact(value);

  if (orientation === 'horizontal') {
    return (
      <HorizontalColumnChart
        columns={columns}
        series={series}
        currency={currency}
        valueFormat={valueFormat}
        selected={selected}
        onSelect={onSelect}
        palette={palette}
      />
    );
  }

  return (
    <View style={[styles.chart, onSelect && styles.labelRoom]}>
      <View style={[styles.axis, { height: plotHeight }]}>
        {grid.ticks.map((tick) => (
          <Typography
            key={tick}
            variant="caption2"
            tone="secondary"
            tabular
            numberOfLines={1}
            style={[styles.tick, { top: yOf(tick) - 7 }]}
          >
            {formatTick(tick)}
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
                  x={0}
                  y={yOf(tick)}
                  width={plotWidth}
                  height={StyleSheet.hairlineWidth}
                  color={tick === 0 ? palette.border : palette.grid}
                />
              ))}
              {gridBoundaries(columns.length).map((fraction) => (
                <Rect
                  key={`vertical-${fraction}`}
                  x={Math.min(plotWidth - StyleSheet.hairlineWidth, fraction * plotWidth)}
                  y={PLOT_INSET}
                  width={StyleSheet.hairlineWidth}
                  height={plotHeight - PLOT_INSET * 2}
                  color={palette.grid}
                />
              ))}
              {columns.flatMap((_, column) => {
                const x = column * slotWidth + (slotWidth - barWidth) / 2;
                let upY = baseline;
                let downY = baseline;
                return [
                  ...segments(up, column).map((part, index) => {
                    upY -= part.height + (index > 0 ? SEGMENT_GAP : 0);
                    return (
                      <RoundedRect
                        key={`${column}-up-${part.color}`}
                        x={x}
                        y={upY}
                        width={barWidth}
                        height={part.height}
                        r={2}
                        color={palette.marks[part.color]}
                      />
                    );
                  }),
                  ...segments(down, column).map((part, index) => {
                    downY += index > 0 || upTotals[column] > 0 ? SEGMENT_GAP : 0;
                    const y = downY;
                    downY += part.height;
                    return (
                      <RoundedRect
                        key={`${column}-down-${part.color}`}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={part.height}
                        r={2}
                        color={palette.marks[part.color]}
                      />
                    );
                  }),
                ];
              })}
            </Canvas>
          )}
          <View style={styles.slots}>
            {columns.map(({ name }, column) => {
              const parts = series
                .filter((item) => item.values[column] > 0)
                .map(
                  (item) =>
                    `${item.label} ${item.direction === 'down' ? '−' : ''}${formatValue(item.values[column])}`,
                );
              const select = onSelect && (() => onSelect(column));
              return (
                <Pressable
                  key={name}
                  disabled={!select}
                  onPress={select}
                  onHoverIn={select}
                  accessibilityRole={select ? 'button' : 'text'}
                  accessibilityLabel={`${name}: ${parts.length ? parts.join(', ') : 'нічого немає'}`}
                  accessibilityState={select && { selected: selected === column }}
                  style={styles.slot}
                />
              );
            })}
          </View>
          {selected !== null && upTotals[selected] > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.valueBox,
                { bottom: plotHeight - baseline + stackHeight(up, selected) + 4 },
                labelPosition(selected),
              ]}
            >
              <Typography
                variant="caption2"
                weight="semibold"
                tabular
                numberOfLines={1}
                align={labelAlign(selected)}
              >
                {formatSelected(upTotals[selected])}
              </Typography>
            </View>
          )}
          {selected !== null && downTotals[selected] > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.valueBox,
                { top: baseline + stackHeight(down, selected) + SEGMENT_GAP + 4 },
                labelPosition(selected),
              ]}
            >
              <Typography
                variant="caption2"
                weight="semibold"
                tabular
                numberOfLines={1}
                align={labelAlign(selected)}
              >
                −{formatSelected(downTotals[selected])}
              </Typography>
            </View>
          )}
        </View>
        <View style={[styles.labels, onSelect && down.length > 0 && styles.labelsBelowLabel]}>
          {columns.map(({ label }, column) => (
            <Typography
              key={column}
              variant="caption2"
              tone={selected === column ? 'primary' : 'secondary'}
              weight={selected === column ? 'semibold' : undefined}
              align="center"
              numberOfLines={1}
              style={styles.label}
            >
              {label}
            </Typography>
          ))}
        </View>
      </View>
    </View>
  );
}

export const ColumnChart: ComponentType<Props> = withUnistyles(ColumnChartView, (theme) => ({
  palette: chartPalette(theme),
}));

const styles = StyleSheet.create((theme) => ({
  chart: { flexDirection: 'row', paddingRight: theme.space.xs },
  labelRoom: { paddingTop: LABEL_SPACE },
  axis: { width: AXIS_WIDTH },
  tick: { position: 'absolute', right: theme.space.xs },
  plotColumn: { flex: 1 },
  canvas: { flex: 1 },
  slots: { position: 'absolute', inset: 0, flexDirection: 'row' },
  slot: { flex: 1, height: '100%' },
  valueBox: { position: 'absolute', width: VALUE_WIDTH },
  valueStart: { left: 0 },
  valueEnd: { right: 0 },
  labels: { flexDirection: 'row', marginTop: theme.space.sm },
  labelsBelowLabel: { marginTop: LABEL_SPACE },
  label: { flex: 1 },
}));
