import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatCompact, formatMoney } from '@/shared/lib';
import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const PLOT_HEIGHT = 160;
/** Taller plot when columns grow both up and down from the baseline */
const SPLIT_PLOT_HEIGHT = 200;
const AXIS_WIDTH = 52;
const VALUE_WIDTH = 72;
/** Room past the tallest and the lowest column for the selected column's value labels */
const LABEL_SPACE = 22;
/** Surface-colored gap between stacked segments */
const SEGMENT_GAP = 2;
/** Non-zero segments stay visible next to much larger ones */
const MIN_SEGMENT = 3;

/** Smallest "round" number ≥ value: 1, 2, 2.5, 5 × 10ⁿ; 0 for nothing to show */
function niceMax(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value)!;
  return step * magnitude;
}

export type ChartSeries = {
  /** Lowercase name for the accessibility label: "купони" */
  label: string;
  color: SeriesColor;
  /** One total per column */
  values: number[];
  /** Money in grows up from the baseline, money out grows down. Defaults to up. */
  direction?: 'up' | 'down';
};

export type ChartColumn = {
  /** Under the column: "січ", "2026" */
  label: string;
  /** For the accessibility label: "Січень", "2026 рік" */
  name: string;
};

type Props = {
  columns: ChartColumn[];
  /** Stacked away from the baseline, the first series of each direction at the baseline */
  series: ChartSeries[];
  currency: string;
  /** A column to label with its values; columns are pressable only with `onSelect` */
  selected?: number | null;
  onSelect?: (column: number) => void;
};

/**
 * Stacked columns on one money scale: "up" series above the baseline, "down" below. The legend
 * lives with the totals below the chart; the selected column carries the value labels.
 */
export function ColumnChart({ columns, series, currency, selected = null, onSelect }: Props) {
  const lastColumn = columns.length - 1;
  const up = series.filter((s) => s.direction !== 'down');
  const down = series.filter((s) => s.direction === 'down');
  const sumOf = (group: ChartSeries[]) =>
    columns.map((_, column) => group.reduce((sum, s) => sum + s.values[column], 0));
  const upTotals = sumOf(up);
  const downTotals = sumOf(down);
  const upMax = niceMax(Math.max(...upTotals));
  const downMax = niceMax(Math.max(...downTotals));
  const range = upMax + downMax || 1;
  const plotHeight = down.length ? SPLIT_PLOT_HEIGHT : PLOT_HEIGHT;
  const unit = plotHeight / range;
  const baseline = upMax * unit || (downMax ? 0 : plotHeight);
  const ticks = [
    ...new Set(down.length ? [upMax, 0, -downMax] : [upMax || 1, (upMax || 1) / 2, 0]),
  ];
  const tickTop = (tick: number) => baseline - tick * unit;
  const scale = (value: number) => (value > 0 ? Math.max(value * unit, MIN_SEGMENT) : 0);
  // Non-empty segments of a column, from the baseline outwards.
  const segments = (group: ChartSeries[], column: number) =>
    group.map((s) => ({ ...s, height: scale(s.values[column]) })).filter((s) => s.height > 0);
  const stackHeight = (group: ChartSeries[], column: number) => {
    const parts = segments(group, column);
    return parts.reduce((sum, s) => sum + s.height, 0) + SEGMENT_GAP * (parts.length - 1);
  };
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

  return (
    <View style={[styles.chart, onSelect && styles.labelRoom]}>
      <View style={[styles.axis, { height: plotHeight }]}>
        {ticks.map((tick) => (
          <Typography
            key={tick}
            variant="caption2"
            tone="secondary"
            tabular
            numberOfLines={1}
            style={[styles.tick, { top: tickTop(tick) - 7 }]}
          >
            {tick < 0 ? `−${formatCompact(-tick)}` : formatCompact(tick)}
          </Typography>
        ))}
      </View>

      <View style={styles.plotColumn}>
        <View style={{ height: plotHeight }}>
          {ticks.map((tick) => (
            <View key={tick} style={[styles.gridline, { top: tickTop(tick) }]} />
          ))}

          <View style={styles.bars}>
            {columns.map(({ name }, column) => {
              const parts = series
                .filter((s) => s.values[column] > 0)
                .map((s) => `${s.label} ${formatMoney(s.values[column], currency)}`);
              const upStack = segments(up, column).reverse();
              const downStack = segments(down, column);
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
                >
                  <View style={[styles.half, styles.upHalf, { height: baseline }]}>
                    {upStack.length > 0 && (
                      <View style={styles.stack}>
                        {upStack.map((s, index) => (
                          <View
                            key={s.label}
                            style={[styles.segment(s.color, s.height), index === 0 && styles.upEnd]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={[styles.half, { height: plotHeight - baseline }]}>
                    {downStack.length > 0 && (
                      <View style={[styles.stack, upStack.length > 0 && styles.belowUp]}>
                        {downStack.map((s, index) => (
                          <View
                            key={s.label}
                            style={[
                              styles.segment(s.color, s.height),
                              index === downStack.length - 1 && styles.downEnd,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Value labels live above the slots: a slot is narrower than a label. */}
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
                {formatCompact(upTotals[selected])}
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
                −{formatCompact(downTotals[selected])}
              </Typography>
            </View>
          )}
        </View>

        <View style={[styles.labels, onSelect && down.length > 0 && styles.labelsBelowLabel]}>
          {columns.map(({ label }, column) => (
            <Typography
              key={label}
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

const styles = StyleSheet.create((theme) => ({
  chart: { flexDirection: 'row', paddingRight: theme.space.xs },
  // Room past the tallest column for the selected column's value label.
  labelRoom: { paddingTop: LABEL_SPACE },
  axis: { width: AXIS_WIDTH },
  tick: { position: 'absolute', right: theme.space.xs },
  plotColumn: { flex: 1 },
  gridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
  },
  bars: { position: 'absolute', inset: 0, flexDirection: 'row' },
  slot: { flex: 1, height: '100%' },
  half: { alignItems: 'center' },
  upHalf: { justifyContent: 'flex-end' },
  stack: { width: '62%', maxWidth: 24, gap: SEGMENT_GAP },
  belowUp: { marginTop: SEGMENT_GAP },
  segment: (color: SeriesColor, height: number) => ({
    height,
    backgroundColor: theme[SERIES_COLORS[color].mark],
  }),
  // Rounded data ends away from the baseline; the baseline side stays square.
  upEnd: { borderTopLeftRadius: theme.radius.xs, borderTopRightRadius: theme.radius.xs },
  downEnd: { borderBottomLeftRadius: theme.radius.xs, borderBottomRightRadius: theme.radius.xs },
  valueBox: { position: 'absolute', width: VALUE_WIDTH },
  valueStart: { left: 0 },
  valueEnd: { right: 0 },
  labels: { flexDirection: 'row', marginTop: theme.space.sm },
  // Room for the selected column's money-out label under the lowest column.
  labelsBelowLabel: { marginTop: LABEL_SPACE },
  label: { flex: 1 },
}));
