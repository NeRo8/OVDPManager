import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ExchangeCurrency } from '@/entities/portfolio';
import { MONTHS, MONTHS_SHORT, formatCompact, formatMoney } from '@/shared/lib';
import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import { Card, LegendRow, SectionTitle, Separator, Typography } from '@/shared/ui';
import type { FxReport } from '../model/fxReport';

type Props = { report: FxReport; currency: ExchangeCurrency };
type Line = { color: SeriesColor; values: number[] };
type Point = { x: number; y: number };

const PLOT_HEIGHT = 180;
const INVESTED_STROKE_WIDTH = 4;
const CURRENT_STROKE_WIDTH = 2;
const INVESTED_DOT_SIZE = 9;
const CURRENT_DOT_SIZE = 5;

/** A line between two plotted points; rotation happens around its center. */
function segmentBetween(first: Point, second: Point, strokeWidth: number) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy);
  return {
    left: (first.x + second.x - length) / 2,
    top: (first.y + second.y - strokeWidth) / 2,
    width: length,
    transform: [{ rotateZ: `${Math.atan2(dy, dx)}rad` as const }],
  };
}

/** Cumulative foreign-currency cost versus remaining UAH cost and received payouts. */
export function FxMonthsChart({ report, currency }: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const months = report.months;
  const lines: Line[] = [
    { color: 'purchase', values: months.map(({ investedFx }) => investedFx) },
    { color: 'redemption', values: months.map(({ currentFx }) => currentFx) },
  ];
  const maxValue = Math.max(0, ...lines.flatMap(({ values }) => values));
  const unit = PLOT_HEIGHT / (maxValue * 1.1 || 1);
  const measurePlot = (event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width);
  const xOf = (index: number) => ((index + 0.5) / months.length) * plotWidth;
  const yOf = (value: number) => PLOT_HEIGHT - value * unit;
  const lastMonth = months[months.length - 1];

  return (
    <View style={styles.section}>
      <SectionTitle title={`Вкладення у валютному еквіваленті · ${currency}`} />
      <Card>
        <View
          style={styles.chart}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Лінійний графік за ${report.year} рік. ${months.map(({ month, investedFx, currentFx }) => `${MONTHS[Number(month.slice(5)) - 1]}: вкладено ${formatMoney(investedFx, currency)}, залишок з виплатами ${formatMoney(currentFx, currency)}`).join('; ')}`}
        >
          <View style={styles.axis}>
            {maxValue > 0 && (
              <Typography
                variant="caption2"
                tone="secondary"
                tabular
                style={[styles.axisTick, { top: yOf(maxValue) - 7 }]}
              >
                {formatCompact(maxValue)}
              </Typography>
            )}
            <Typography
              variant="caption2"
              tone="secondary"
              tabular
              style={[styles.axisTick, { top: PLOT_HEIGHT - 12 }]}
            >
              0
            </Typography>
          </View>
          <View style={styles.plotColumn}>
            <View style={styles.plot} onLayout={measurePlot}>
              <View style={[styles.baseline, { top: PLOT_HEIGHT - 1 }]} />
              {plotWidth > 0 &&
                lines.map(({ color, values }) => {
                  const points = values.map((value, index) => ({ x: xOf(index), y: yOf(value) }));
                  const strokeWidth =
                    color === 'purchase' ? INVESTED_STROKE_WIDTH : CURRENT_STROKE_WIDTH;
                  const dotSize = color === 'purchase' ? INVESTED_DOT_SIZE : CURRENT_DOT_SIZE;
                  return (
                    <View key={color} style={styles.lineLayer} pointerEvents="none">
                      {points.slice(1).map((point, index) => (
                        <View
                          key={`line-${index}`}
                          style={[
                            styles.stroke(color, strokeWidth),
                            segmentBetween(points[index], point, strokeWidth),
                          ]}
                        />
                      ))}
                      {points.map((point, index) => (
                        <View
                          key={`dot-${index}`}
                          style={[
                            styles.dot(color, dotSize),
                            { left: point.x - dotSize / 2, top: point.y - dotSize / 2 },
                          ]}
                        />
                      ))}
                    </View>
                  );
                })}
            </View>
            <View style={styles.labels}>
              {months.map(({ month }) => {
                const index = Number(month.slice(5)) - 1;
                return (
                  <Typography
                    key={month}
                    variant="caption2"
                    tone="secondary"
                    align="center"
                    numberOfLines={1}
                    accessibilityLabel={MONTHS[index]}
                    style={styles.monthLabel}
                  >
                    {MONTHS_SHORT[index]}
                  </Typography>
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.separator}>
          <Separator />
        </View>
        <View style={styles.legend}>
          <LegendRow
            color="purchase"
            label="Вкладено"
            value={formatMoney(lastMonth.investedFx, currency)}
          />
          <LegendRow
            color="redemption"
            label="Залишок + виплати"
            value={formatMoney(lastMonth.currentFx, currency)}
          />
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        «Вкладено» — накопичені купівлі за курсом їхніх дат. Друга лінія — залишок гривневих
        вкладень за курсом на кінець місяця та отримані виплати за курсом їхніх дат. Ринкову ціну
        ОВДП не враховано.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  chart: { flexDirection: 'row' },
  axis: { width: 48, height: PLOT_HEIGHT },
  axisTick: { position: 'absolute', right: theme.space.xs },
  plotColumn: { flex: 1 },
  plot: { height: PLOT_HEIGHT },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
  },
  lineLayer: { ...StyleSheet.absoluteFillObject },
  stroke: (color: SeriesColor, width: number) => ({
    position: 'absolute',
    height: width,
    backgroundColor: theme[SERIES_COLORS[color].mark],
  }),
  dot: (color: SeriesColor, size: number) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: theme.radius.full,
    backgroundColor: theme[SERIES_COLORS[color].mark],
  }),
  labels: { flexDirection: 'row', marginTop: theme.space.sm },
  monthLabel: { flex: 1 },
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  legend: { gap: theme.space.sm },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
