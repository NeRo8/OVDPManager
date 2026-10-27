import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ExchangeCurrency } from '@/entities/portfolio';
import { MONTHS, MONTHS_SHORT, formatCompact, formatMoney } from '@/shared/lib';
import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import {
  Card,
  LegendRow,
  SectionTitle,
  Separator,
  SignedValue,
  Swatch,
  Typography,
} from '@/shared/ui';
import type { FxReport } from '../model/fxReport';

type Props = { report: FxReport; currency: ExchangeCurrency };
type Line = { color: SeriesColor; values: number[] };
type Point = { x: number; y: number };

const PLOT_HEIGHT = 180;
const INVESTED_STROKE_WIDTH = 4;
const CURRENT_STROKE_WIDTH = 2;
const INVESTED_DOT_SIZE = 9;
const CURRENT_DOT_SIZE = 5;
const TIME_LABEL_WIDTH = 54;
const AXIS_LABEL_GAP = 24;

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

/** All-time gain or loss, or a year's cumulative purchases and payouts. */
export function FxTimelineChart({ report, currency }: Props) {
  return report.year === null ? (
    <FxDifferenceChart report={report} currency={currency} />
  ) : (
    <FxComparisonChart report={report} currency={currency} />
  );
}

/** The monthly comparison kept for a selected calendar year. */
function FxComparisonChart({ report, currency }: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const { points } = report;
  const lines: Line[] = [
    { color: 'purchase', values: points.map(({ investedFx }) => investedFx) },
    { color: 'redemption', values: points.map(({ currentFx }) => currentFx) },
  ];
  const maxValue = Math.max(0, ...lines.flatMap(({ values }) => values));
  const unit = PLOT_HEIGHT / (maxValue * 1.1 || 1);
  const measurePlot = (event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width);
  const xOf = (index: number) => ((index + 0.5) / points.length) * plotWidth;
  const yOf = (value: number) => PLOT_HEIGHT - value * unit;
  const lastPoint = points[points.length - 1];
  const pointName = (period: string) => MONTHS[Number(period.slice(5)) - 1];

  return (
    <View style={styles.section}>
      <SectionTitle title={`Вкладення у валютному еквіваленті · ${currency}`} />
      <Card>
        <View
          style={styles.chart}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Лінійний графік за ${report.year} рік. ${points.map(({ period, investedFx, currentFx }) => `${pointName(period)}: вкладено ${formatMoney(investedFx, currency)}, залишок з виплатами ${formatMoney(currentFx, currency)}`).join('; ')}`}
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
              {points.map(({ period }) => {
                const monthIndex = Number(period.slice(5)) - 1;
                return (
                  <Typography
                    key={period}
                    variant="caption2"
                    tone="secondary"
                    align="center"
                    numberOfLines={1}
                    accessibilityLabel={pointName(period)}
                    style={styles.monthLabel}
                  >
                    {MONTHS_SHORT[monthIndex]}
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
            value={formatMoney(lastPoint.investedFx, currency)}
          />
          <LegendRow
            color="redemption"
            label="Залишок + виплати"
            value={formatMoney(lastPoint.currentFx, currency)}
          />
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        «Вкладено» — накопичені купівлі за курсом їхніх дат. Друга лінія — залишок гривневих
        вкладень за курсом на кінець місяця та отримані виплати за курсом їхніх дат. Ринкову ціну
        ОВДП не враховано. Реінвестовані виплати залишаються у сумі виплат, тому друга лінія не є
        сумою грошей, доступних зараз.
      </Typography>
    </View>
  );
}

/** Monthly difference from cumulative purchases, with zero separating gain and loss. */
function FxDifferenceChart({ report, currency }: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const { points } = report;
  const values = points.map(({ investedFx, currentFx }) => currentFx - investedFx);
  const highest = Math.max(0, ...values);
  const lowest = Math.min(0, ...values);
  const padding = Math.max(1, (highest - lowest) * 0.12);
  const upper = highest + padding;
  const unit = PLOT_HEIGHT / (upper - lowest + padding);
  const xOf = (index: number) => ((index + 0.5) / points.length) * plotWidth;
  const yOf = (value: number) => (upper - value) * unit;
  const showHighest = highest > 0 && yOf(0) - yOf(highest) >= AXIS_LABEL_GAP;
  const showLowest = lowest < 0 && yOf(lowest) - yOf(0) >= AXIS_LABEL_GAP;
  const chartPoints = values.map((value, index) => ({ x: xOf(index), y: yOf(value) }));
  const lastValue = values[values.length - 1];
  const labelStep = Math.max(1, Math.ceil(points.length / 4));
  const lastLabelLeft = Math.max(0, plotWidth - TIME_LABEL_WIDTH);
  const labels: { index: number; left: number }[] = [];
  if (plotWidth > 0) {
    for (let index = 0; index < points.length - 1; index += labelStep) {
      const left = Math.max(0, xOf(index) - TIME_LABEL_WIDTH / 2);
      if (
        left + TIME_LABEL_WIDTH + 4 <= lastLabelLeft &&
        (labels.length === 0 || left >= labels[labels.length - 1].left + TIME_LABEL_WIDTH + 4)
      ) {
        labels.push({ index, left });
      }
    }
    labels.push({ index: points.length - 1, left: lastLabelLeft });
  }
  const shortDate = (period: string) =>
    `${MONTHS_SHORT[Number(period.slice(5)) - 1]} ${period.slice(2, 4)}`;
  const signedMoney = (value: number) => `${value > 0 ? '+' : ''}${formatMoney(value, currency)}`;
  const axisLabel = (value: number) =>
    value < 0 ? `−${formatCompact(-value)}` : formatCompact(value);

  return (
    <View style={styles.section}>
      <SectionTitle title={`Різниця з вкладеним · ${currency}`} />
      <Card>
        <View
          style={styles.chart}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Помісячний графік різниці з вкладеним від ${points[0].period} до ${points[points.length - 1].period}. Найменше ${signedMoney(lowest)}, найбільше ${signedMoney(highest)}, на останню дату ${signedMoney(lastValue)}. Нульова лінія відділяє приріст від зменшення.`}
        >
          <View style={styles.axis}>
            {showHighest && (
              <Typography
                variant="caption2"
                tone="secondary"
                tabular
                style={[styles.axisTick, { top: yOf(highest) - 7 }]}
              >
                {axisLabel(highest)}
              </Typography>
            )}
            <Typography
              variant="caption2"
              tone="secondary"
              tabular
              style={[styles.axisTick, { top: yOf(0) - 7 }]}
            >
              0
            </Typography>
            {showLowest && (
              <Typography
                variant="caption2"
                tone="secondary"
                tabular
                style={[styles.axisTick, { top: yOf(lowest) - 7 }]}
              >
                {axisLabel(lowest)}
              </Typography>
            )}
          </View>
          <View style={styles.plotColumn}>
            <View
              style={styles.plot}
              onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}
            >
              <View style={[styles.baseline, { top: yOf(0) }]} />
              {plotWidth > 0 && (
                <View style={styles.lineLayer} pointerEvents="none">
                  {chartPoints.slice(1).map((point, index) => (
                    <View
                      key={`line-${index}`}
                      style={[
                        styles.stroke('redemption', CURRENT_STROKE_WIDTH),
                        segmentBetween(chartPoints[index], point, CURRENT_STROKE_WIDTH),
                      ]}
                    />
                  ))}
                  {chartPoints.map((point, index) => {
                    const period = points[index].period;
                    if (index !== 0 && index !== points.length - 1 && !period.endsWith('-01')) {
                      return null;
                    }
                    const size = index === points.length - 1 ? INVESTED_DOT_SIZE : CURRENT_DOT_SIZE;
                    return (
                      <View
                        key={period}
                        style={[
                          styles.dot('redemption', size),
                          { left: point.x - size / 2, top: point.y - size / 2 },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>
            <View style={styles.timeLabels}>
              {labels.map(({ index, left }) => (
                <Typography
                  key={points[index].period}
                  variant="caption2"
                  tone="secondary"
                  tabular
                  align="center"
                  numberOfLines={1}
                  style={[styles.timeLabel, { left }]}
                >
                  {shortDate(points[index].period)}
                </Typography>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.separator}>
          <Separator />
        </View>
        <View style={styles.resultRow}>
          <Swatch color="redemption" />
          <Typography variant="footnote" tone="secondary" style={styles.resultLabel}>
            Різниця на останню дату
          </Typography>
          <SignedValue value={lastValue} variant="footnote" weight="semibold" tabular>
            {signedMoney(lastValue)}
          </SignedValue>
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        Кожна точка — кінець місяця, для поточного — сьогодні. Різниця = отримані виплати + залишок
        ОВДП за собівартістю − усі купівлі у валютному еквіваленті. Реінвестовані виплати й нові
        купівлі враховано окремо. Для непогашених ОВДП це оцінка, а не остаточний дохід.
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
  timeLabels: { height: 18, marginTop: theme.space.sm },
  timeLabel: { position: 'absolute', width: TIME_LABEL_WIDTH },
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  legend: { gap: theme.space.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  resultLabel: { flex: 1 },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
