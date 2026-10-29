import { Fragment, useState, type ComponentType } from 'react';
import { View } from 'react-native';

import { Canvas, Circle, Path, Rect } from '@shopify/react-native-skia';
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import { formatMoney } from '@/shared/lib';
import type { SeriesColor } from '@/shared/theme';

import { Typography } from '../typography/Typography';

import { chartGrid, formatGridTick, gridBoundaries } from './chartGrid';
import { chartPalette, type ChartPalette } from './chartTheme';

const PLOT_HEIGHT = 180;
const PLOT_INSET = 8;
const AXIS_WIDTH = 48;
const TIME_LABEL_WIDTH = 54;
const LABEL_GAP = 4;

export type LineChartSeries = {
  label: string;
  color: SeriesColor;
  values: number[];
  strokeWidth?: number;
  dotSize?: number;
  dotIndices?: number[];
};

type Props = {
  labels: string[];
  names: string[];
  series: LineChartSeries[];
  currency: string;
  min: number;
  max: number;
  sparseLabels?: boolean;
  accessibilityLabel: string;
};

type ThemedProps = Props & { palette: ChartPalette };

/** One scale and touch target for one or more series. The axis and labels remain native text. */
function LineChartView({
  labels,
  names,
  series,
  currency,
  min,
  max,
  sparseLabels = false,
  accessibilityLabel,
  palette,
}: ThemedProps) {
  const [plotWidth, setPlotWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const cursor = useSharedValue(-1);
  const count = labels.length;
  const grid = chartGrid(min, max);
  const range = grid.max - grid.min;
  const xOf = (index: number) => ((index + 0.5) / count) * plotWidth;
  const yOf = (value: number) =>
    PLOT_INSET + ((grid.max - value) / range) * (PLOT_HEIGHT - PLOT_INSET * 2);
  const cursorX = useDerivedValue(() => ((cursor.get() + 0.5) / count) * plotWidth);
  const tap = useTapGesture({
    enabled: count > 0 && plotWidth > 0,
    onActivate: (event) => {
      const index = Math.max(0, Math.min(count - 1, Math.floor((event.x / plotWidth) * count)));
      cursor.set(withTiming(index, { duration: reduceMotion ? 0 : 180 }));
      scheduleOnRN(setSelectedIndex, index);
    },
  });

  const labelPositions: { index: number; left: number }[] = [];
  if (sparseLabels && plotWidth > 0 && count > 0) {
    const lastLeft = Math.max(0, plotWidth - TIME_LABEL_WIDTH);
    const step = Math.max(1, Math.ceil(count / 4));
    for (let index = 0; index < count - 1; index += step) {
      const left = Math.max(0, xOf(index) - TIME_LABEL_WIDTH / 2);
      if (
        left + TIME_LABEL_WIDTH + LABEL_GAP <= lastLeft &&
        (labelPositions.length === 0 ||
          left >= labelPositions[labelPositions.length - 1].left + TIME_LABEL_WIDTH + LABEL_GAP)
      ) {
        labelPositions.push({ index, left });
      }
    }
    labelPositions.push({ index: count - 1, left: lastLeft });
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={styles.chart}>
        <View style={styles.axis}>
          {grid.ticks.map((tick) => (
            <Typography
              key={tick}
              variant="caption2"
              tone="secondary"
              tabular
              numberOfLines={1}
              style={[styles.tick, { top: yOf(tick) - 7 }]}
            >
              {formatGridTick(tick, grid.step)}
            </Typography>
          ))}
        </View>
        <View style={styles.plotColumn}>
          <GestureDetector gesture={tap}>
            <View
              style={styles.plot}
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
                  {gridBoundaries(count).map((fraction) => (
                    <Rect
                      key={`vertical-${fraction}`}
                      x={Math.min(plotWidth - StyleSheet.hairlineWidth, fraction * plotWidth)}
                      y={PLOT_INSET}
                      width={StyleSheet.hairlineWidth}
                      height={PLOT_HEIGHT - PLOT_INSET * 2}
                      color={palette.grid}
                    />
                  ))}
                  {series.map(({ color, values, strokeWidth = 2, dotSize = 5, dotIndices }) => {
                    const path = values
                      .map(
                        (value, index) => `${index === 0 ? 'M' : 'L'} ${xOf(index)} ${yOf(value)}`,
                      )
                      .join(' ');
                    const shownDots = dotIndices ?? values.map((_, index) => index);
                    return (
                      <Fragment key={color}>
                        {values.length > 1 && (
                          <Path
                            path={path}
                            color={palette.marks[color]}
                            style="stroke"
                            strokeWidth={strokeWidth}
                            strokeCap="round"
                            strokeJoin="round"
                          />
                        )}
                        {shownDots.map((index) => (
                          <Circle
                            key={index}
                            cx={xOf(index)}
                            cy={yOf(values[index])}
                            r={dotSize / 2}
                            color={palette.marks[color]}
                          />
                        ))}
                      </Fragment>
                    );
                  })}
                  <Rect
                    x={cursorX}
                    y={0}
                    width={StyleSheet.hairlineWidth}
                    height={PLOT_HEIGHT}
                    color={palette.border}
                  />
                </Canvas>
              )}
            </View>
          </GestureDetector>
          {sparseLabels ? (
            <View style={styles.sparseLabels}>
              {labelPositions.map(({ index, left }) => (
                <Typography
                  key={index}
                  variant="caption2"
                  tone="secondary"
                  tabular
                  align="center"
                  numberOfLines={1}
                  style={[styles.sparseLabel, { left }]}
                >
                  {labels[index]}
                </Typography>
              ))}
            </View>
          ) : (
            <View style={styles.labels}>
              {labels.map((label, index) => (
                <Typography
                  key={index}
                  variant="caption2"
                  tone="secondary"
                  align="center"
                  numberOfLines={1}
                  style={styles.label}
                >
                  {label}
                </Typography>
              ))}
            </View>
          )}
        </View>
      </View>
      {selectedIndex !== null && selectedIndex < count && (
        <Typography variant="caption2" tone="secondary" align="center" style={styles.readout}>
          {names[selectedIndex]} ·{' '}
          {series
            .map(({ label, values }) => `${label} ${formatMoney(values[selectedIndex], currency)}`)
            .join(' · ')}
        </Typography>
      )}
    </View>
  );
}

export const LineChart: ComponentType<Props> = withUnistyles(LineChartView, (theme) => ({
  palette: chartPalette(theme),
}));

const styles = StyleSheet.create((theme) => ({
  chart: { flexDirection: 'row' },
  axis: { width: AXIS_WIDTH, height: PLOT_HEIGHT },
  tick: { position: 'absolute', right: theme.space.xs },
  plotColumn: { flex: 1 },
  plot: { height: PLOT_HEIGHT },
  canvas: { flex: 1 },
  labels: { flexDirection: 'row', marginTop: theme.space.sm },
  label: { flex: 1 },
  sparseLabels: { height: 18, marginTop: theme.space.sm },
  sparseLabel: { position: 'absolute', width: TIME_LABEL_WIDTH },
  readout: { marginTop: theme.space.sm },
}));
