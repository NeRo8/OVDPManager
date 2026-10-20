import { Pressable, StyleSheet, View } from 'react-native';

import { MONTHS, MONTHS_SHORT, formatCompact, formatMoney } from '@/shared/lib';
import { themeStyles } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const PLOT_HEIGHT = 160;
const AXIS_WIDTH = 52;
const VALUE_WIDTH = 72;
/** Room above the tallest bar for the selected bar's value label */
const LABEL_SPACE = 22;
/** Surface-colored gap between stacked segments */
const SEGMENT_GAP = 2;
/** Non-zero segments stay visible next to much larger ones */
const MIN_SEGMENT = 3;

/** Smallest "round" number ≥ value: 1, 2, 2.5, 5 × 10ⁿ */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value)!;
  return step * magnitude;
}

export type ChartSeries = {
  /** Lowercase name for the accessibility label: "купони" */
  label: string;
  color: string;
  /** Twelve monthly totals, January first */
  values: number[];
};

type Props = {
  /** Stacked from the baseline up */
  series: ChartSeries[];
  currency: string;
  selected: number | null;
  onSelect: (month: number) => void;
};

/**
 * Monthly stacked columns, the first series at the baseline.
 * The legend lives with the totals above the chart; the selected month carries the value label.
 */
export function MonthChart({ series, currency, selected, onSelect }: Props) {
  const theme = themeStyles;
  const totals = MONTHS.map((_, month) => series.reduce((sum, s) => sum + s.values[month], 0));
  const max = niceMax(Math.max(...totals));
  const ticks = [max, max / 2, 0];
  const scale = (value: number) =>
    value > 0 ? Math.max((value / max) * PLOT_HEIGHT, MIN_SEGMENT) : 0;
  // Non-empty segments of a month, top first.
  const segments = (month: number) =>
    series
      .map((s) => ({ ...s, height: scale(s.values[month]) }))
      .filter((s) => s.height > 0)
      .reverse();
  const stackHeight = (month: number) => {
    const parts = segments(month);
    return parts.reduce((sum, s) => sum + s.height, 0) + SEGMENT_GAP * (parts.length - 1);
  };

  return (
    <View style={styles.chart}>
      <View style={styles.axis}>
        {ticks.map((tick) => (
          <Typography
            key={tick}
            variant="caption2"
            tone="secondary"
            tabular
            numberOfLines={1}
            style={[styles.tick, { top: (1 - tick / max) * PLOT_HEIGHT - 7 }]}
          >
            {formatCompact(tick)}
          </Typography>
        ))}
      </View>

      <View style={styles.plotColumn}>
        <View style={styles.plot}>
          {ticks.map((tick) => (
            <View
              key={tick}
              style={[
                styles.gridline,
                theme.borderBackground,
                { top: (1 - tick / max) * PLOT_HEIGHT },
              ]}
            />
          ))}

          <View style={styles.bars}>
            {totals.map((total, month) => {
              const stack = segments(month);
              const parts = series
                .filter((s) => s.values[month] > 0)
                .map((s) => `${s.label} ${formatMoney(s.values[month], currency)}`);
              return (
                <Pressable
                  key={month}
                  onPress={() => onSelect(month)}
                  onHoverIn={() => onSelect(month)}
                  accessibilityRole="button"
                  accessibilityLabel={`${MONTHS[month]}: ${parts.length ? parts.join(', ') : 'виплат немає'}`}
                  accessibilityState={{ selected: selected === month }}
                  style={styles.slot}
                >
                  {total > 0 && (
                    <View style={styles.stack}>
                      {stack.map((s, index) => (
                        <View
                          key={s.label}
                          style={[
                            index === 0 && styles.dataEnd,
                            { height: s.height, backgroundColor: s.color },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Value label lives above the slots: a slot is narrower than the label. */}
          {selected !== null && totals[selected] > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.valueBox,
                { bottom: stackHeight(selected) + 4 },
                selected === 0
                  ? styles.valueStart
                  : selected === 11
                    ? styles.valueEnd
                    : { left: `${((selected + 0.5) / 12) * 100}%`, marginLeft: -VALUE_WIDTH / 2 },
              ]}
            >
              <Typography
                variant="caption2"
                weight="semibold"
                tabular
                numberOfLines={1}
                align={selected === 0 ? 'left' : selected === 11 ? 'right' : 'center'}
              >
                {formatCompact(totals[selected])}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.months}>
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

/** Swatch + name + amount: the chart legend doubles as the breakdown of the total. */
export function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
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
  chart: { flexDirection: 'row', paddingTop: LABEL_SPACE, paddingRight: 4 },
  axis: { width: AXIS_WIDTH, height: PLOT_HEIGHT },
  tick: { position: 'absolute', right: 6 },
  plotColumn: { flex: 1 },
  plot: { height: PLOT_HEIGHT },
  gridline: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bars: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  stack: { width: '62%', maxWidth: 24, gap: SEGMENT_GAP },
  // Rounded data end on the top segment only; the baseline stays square.
  dataEnd: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  valueBox: { position: 'absolute', width: VALUE_WIDTH },
  valueStart: { left: 0 },
  valueEnd: { right: 0 },
  months: { flexDirection: 'row', marginTop: 6 },
  month: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { flex: 1 },
});
