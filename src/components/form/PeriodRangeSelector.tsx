import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/components/typography/Typography';

import {
  movePeriodHandle,
  periodHandleLimits,
  type PeriodHandle,
  type PeriodRange,
  type PeriodRangeLimits,
} from './periodRange';
import { PeriodRangeHandle } from './PeriodRangeHandle';

type Props = {
  value: PeriodRange;
  limits: PeriodRangeLimits;
  onChange: (value: PeriodRange) => void;
};

type Draft = { index: PeriodHandle; year: number };

const HANDLES = [0, 1, 2, 3] as const;

const yearsLabel = (start: number, end: number) =>
  start === end ? String(start) : `${start}–${end}`;

/**
 * Two ordered, non-overlapping year ranges; each end is dragged on its own. The handles move on
 * the UI thread; the summary follows the year under the finger, and the value changes on release.
 */
export function PeriodRangeSelector({ value, limits, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const positions = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const [start, end, couponStart, couponEnd] = positions;
  const stepWidth = width / (limits.max - limits.min);
  const shown = draft ? movePeriodHandle(value, draft.index, draft.year, limits) : value;

  const purchaseBar = useAnimatedStyle(() => ({
    transform: [{ translateX: start.get() }],
    width: end.get() - start.get(),
  }));
  const couponBar = useAnimatedStyle(() => ({
    transform: [{ translateX: couponStart.get() }],
    width: couponEnd.get() - couponStart.get(),
  }));

  const preview = (index: PeriodHandle, year: number) => setDraft({ index, year });
  const commit = (index: PeriodHandle, year: number) => {
    setDraft(null);
    if (year !== value[index]) onChange(movePeriodHandle(value, index, year, limits));
  };
  const cancel = () => setDraft(null);
  const adjust = (index: PeriodHandle, direction: number) =>
    onChange(movePeriodHandle(value, index, value[index] + direction, limits));
  const measure = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={[styles.swatch, styles.purchase]} />
          <Typography variant="footnote" tone="secondary">
            Інвестування: {yearsLabel(shown[0], shown[1] - 1)}
          </Typography>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.swatch, styles.coupon]} />
          <Typography variant="footnote" tone="secondary">
            Купони: {yearsLabel(shown[2], shown[3] - 1)}
          </Typography>
        </View>
      </View>
      <View style={styles.railSpace}>
        <View style={styles.rail} onLayout={measure}>
          <View style={styles.track} />
          {width > 0 && (
            <>
              <Animated.View style={[styles.bar, styles.purchase, purchaseBar]} />
              <Animated.View style={[styles.bar, styles.coupon, couponBar]} />
              {HANDLES.map((index) => {
                const [min, max] = periodHandleLimits(value, index, limits);
                return (
                  <PeriodRangeHandle
                    key={index}
                    index={index}
                    value={value[index]}
                    min={min}
                    max={max}
                    origin={limits.min}
                    stepWidth={stepWidth}
                    position={positions[index]}
                    onPreview={preview}
                    onCommit={commit}
                    onCancel={cancel}
                    onAdjust={adjust}
                  />
                );
              })}
            </>
          )}
        </View>
      </View>
      <View style={styles.endpoints}>
        <Typography variant="caption1" tone="secondary">
          {limits.min}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {limits.max - 1}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { padding: theme.space.lg, gap: theme.space.sm },
  summary: { gap: theme.space.xs },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  swatch: { width: 10, height: 10, borderRadius: theme.radius.full },
  railSpace: { paddingHorizontal: 22 },
  rail: { height: 90, justifyContent: 'center' },
  track: { height: 8, borderRadius: theme.radius.full, backgroundColor: theme.muted },
  bar: { position: 'absolute', left: 0, top: 41, height: 8 },
  purchase: { backgroundColor: theme.accentFill },
  coupon: { backgroundColor: theme.seriesRedemption },
  endpoints: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22 },
}));
