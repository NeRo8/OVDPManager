import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MONTHS, MONTHS_SHORT, formatCompact, formatMoney } from '@/shared/lib';
import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const PLOT_HEIGHT = 160;
/** Taller plot when columns grow both up and down from the baseline */
const SPLIT_PLOT_HEIGHT = 200;
const AXIS_WIDTH = 52;
const VALUE_WIDTH = 72;
/** Room past the tallest column for the selected column's value label */
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
  /** Twelve monthly totals, January first */
  values: number[];
  /** Money in grows up from the baseline, money out grows down. Defaults to up. */
  direction?: 'up' | 'down';
};

type Props = {
  /** Stacked away from the baseline, the first series of each direction at the baseline */
  series: ChartSeries[];
  currency: string;
  selected: number | null;
  onSelect: (month: number) => void;
};

/**
 * Monthly stacked columns on one money scale: "up" series above the baseline, "down" below.
 * The legend lives with the totals above the chart; the selected month carries the value labels.
 */
export function MonthChart({ series, currency, selected, onSelect }: Props) {
  const up = series.filter((s) => s.direction !== 'down');
  const down = series.filter((s) => s.direction === 'down');
  const sumOf = (group: ChartSeries[]) =>
    MONTHS.map((_, month) => group.reduce((sum, s) => sum + s.values[month], 0));
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
  // Non-empty segments of a month, from the baseline outwards.
  const segments = (group: ChartSeries[], month: number) =>
    group.map((s) => ({ ...s, height: scale(s.values[month]) })).filter((s) => s.height > 0);
  const stackHeight = (group: ChartSeries[], month: number) => {
    const parts = segments(group, month);
    return parts.reduce((sum, s) => sum + s.height, 0) + SEGMENT_GAP * (parts.length - 1);
  };
  const labelPosition = (month: number) =>
    month === 0
      ? styles.valueStart
      : month === 11
        ? styles.valueEnd
        : { left: `${((month + 0.5) / 12) * 100}%` as const, marginLeft: -VALUE_WIDTH / 2 };
  const labelAlign = (month: number) => (month === 0 ? 'left' : month === 11 ? 'right' : 'center');

  return (
    <View style={styles.chart}>
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
            {MONTHS.map((name, month) => {
              const parts = series
                .filter((s) => s.values[month] > 0)
                .map((s) => `${s.label} ${formatMoney(s.values[month], currency)}`);
              const upStack = segments(up, month).reverse();
              const downStack = segments(down, month);
              return (
                <Pressable
                  key={name}
                  onPress={() => onSelect(month)}
                  onHoverIn={() => onSelect(month)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}: ${parts.length ? parts.join(', ') : 'нічого немає'}`}
                  accessibilityState={{ selected: selected === month }}
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

        <View style={[styles.months, down.length > 0 && styles.monthsBelowLabel]}>
          {MONTHS_SHORT.map((name, month) => (
            <Typography
              key={name}
              variant="caption2"
              tone={selected === month ? 'primary' : 'secondary'}
              weight={selected === month ? 'semibold' : undefined}
              align="center"
              style={styles.month}
            >
              {name}
            </Typography>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chart: { flexDirection: 'row', paddingTop: LABEL_SPACE, paddingRight: theme.space.xs },
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
  months: { flexDirection: 'row', marginTop: theme.space.sm },
  // Room for the selected month's money-out label under the lowest column.
  monthsBelowLabel: { marginTop: LABEL_SPACE },
  month: { flex: 1 },
}));
