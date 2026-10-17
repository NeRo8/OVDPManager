import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MONTHS, MONTHS_SHORT, formatCompact, formatMoney } from '@/lib/format';
import { useColors } from '@/theme/colors';

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

type Props = {
  /** Twelve monthly coupon totals, January first */
  coupons: number[];
  /** Twelve monthly nominal redemption totals, January first */
  redemptions: number[];
  currency: string;
  selected: number | null;
  onSelect: (month: number) => void;
};

/**
 * Monthly stacked columns: coupons at the baseline, nominal redemption on top.
 * The legend lives with the totals above the chart; the selected month carries the value label.
 */
export function MonthChart({ coupons, redemptions, currency, selected, onSelect }: Props) {
  const colors = useColors();
  const totals = coupons.map((coupon, month) => coupon + redemptions[month]);
  const max = niceMax(Math.max(...totals));
  const ticks = [max, max / 2, 0];
  const scale = (value: number) =>
    value > 0 ? Math.max((value / max) * PLOT_HEIGHT, MIN_SEGMENT) : 0;
  const stackHeight = (month: number) =>
    scale(coupons[month]) +
    scale(redemptions[month]) +
    (coupons[month] > 0 && redemptions[month] > 0 ? SEGMENT_GAP : 0);

  return (
    <View style={styles.chart}>
      <View style={styles.axis}>
        {ticks.map((tick) => (
          <Text
            key={tick}
            numberOfLines={1}
            style={[
              styles.tick,
              { color: colors.secondaryText, top: (1 - tick / max) * PLOT_HEIGHT - 7 },
            ]}
          >
            {formatCompact(tick)}
          </Text>
        ))}
      </View>

      <View style={styles.plotColumn}>
        <View style={styles.plot}>
          {ticks.map((tick) => (
            <View
              key={tick}
              style={[
                styles.gridline,
                { backgroundColor: colors.border, top: (1 - tick / max) * PLOT_HEIGHT },
              ]}
            />
          ))}

          <View style={styles.bars}>
            {totals.map((total, month) => {
              const couponHeight = scale(coupons[month]);
              const nominalHeight = scale(redemptions[month]);
              const parts = [
                coupons[month] > 0 && `купони ${formatMoney(coupons[month], currency)}`,
                redemptions[month] > 0 && `номінал ${formatMoney(redemptions[month], currency)}`,
              ].filter(Boolean);
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
                      {nominalHeight > 0 && (
                        <View
                          style={[
                            styles.dataEnd,
                            { height: nominalHeight, backgroundColor: colors.seriesNominal },
                          ]}
                        />
                      )}
                      {couponHeight > 0 && (
                        <View
                          style={[
                            nominalHeight === 0 && styles.dataEnd,
                            { height: couponHeight, backgroundColor: colors.seriesCoupon },
                          ]}
                        />
                      )}
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
              <Text
                numberOfLines={1}
                style={[
                  styles.value,
                  { color: colors.text },
                  selected === 0 ? styles.alignStart : selected === 11 ? styles.alignEnd : null,
                ]}
              >
                {formatCompact(totals[selected])}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.months}>
          {MONTHS_SHORT.map((name, month) => (
            <Text
              key={name}
              style={[
                styles.month,
                selected === month
                  ? { color: colors.text, fontWeight: '600' }
                  : { color: colors.secondaryText },
              ]}
            >
              {name}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', paddingTop: LABEL_SPACE, paddingRight: 4 },
  axis: { width: AXIS_WIDTH, height: PLOT_HEIGHT },
  tick: {
    position: 'absolute',
    right: 6,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
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
  value: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'center' },
  alignStart: { textAlign: 'left' },
  alignEnd: { textAlign: 'right' },
  months: { flexDirection: 'row', marginTop: 6 },
  month: { flex: 1, textAlign: 'center', fontSize: 11 },
});
