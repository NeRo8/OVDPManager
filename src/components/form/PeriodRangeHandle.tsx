import { useEffect, useRef } from 'react';
import { type AccessibilityActionEvent, View } from 'react-native';

import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import type { PeriodHandle } from './periodRange';

type Props = {
  index: PeriodHandle;
  /** The saved boundary year. */
  value: number;
  /** Where this boundary may go while the other three stay. */
  min: number;
  max: number;
  /** The scale's first year and the width of one year on it. */
  origin: number;
  stepWidth: number;
  /** The handle's position on the rail, shared with the range bars. */
  position: SharedValue<number>;
  /** The year under the finger, each time it changes during a drag. */
  onPreview: (index: PeriodHandle, year: number) => void;
  onCommit: (index: PeriodHandle, year: number) => void;
  onCancel: () => void;
  onAdjust: (index: PeriodHandle, direction: number) => void;
};

const HANDLE_SIZE = 44;
const SNAP = { duration: 160 };
const LABELS = [
  'Початок інвестування',
  'Кінець інвестування',
  'Початок отримання купонів',
  'Кінець отримання купонів',
] as const;
const ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

/** One draggable boundary: follows the finger on the UI thread and settles on a whole year. */
export function PeriodRangeHandle({
  index,
  value,
  min,
  max,
  origin,
  stepWidth,
  position,
  onPreview,
  onCommit,
  onCancel,
  onAdjust,
}: Props) {
  const x = (value - origin) * stepWidth;
  const dragStart = useSharedValue(0);
  const shownYear = useSharedValue(value);
  const placed = useRef(false);
  const isEnd = index === 1 || index === 3;
  const isPurchase = index < 2;

  // A saved value moves the handle: after a drag, an accessibility action or a new layout. The
  // first placement is instant, so the handles do not slide in when the screen opens.
  useEffect(() => {
    position.set(placed.current ? withTiming(x, SNAP) : x);
    placed.current = true;
  }, [position, x]);

  const pan = usePanGesture({
    // Horizontal drags move the handle; vertical ones are left to the scroll view.
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: () => {
      dragStart.set(position.get());
      shownYear.set(value);
    },
    onUpdate: (event) => {
      const next = Math.min(
        (max - origin) * stepWidth,
        Math.max((min - origin) * stepWidth, dragStart.get() + event.translationX),
      );
      position.set(next);
      const year = origin + Math.round(next / stepWidth);
      if (year !== shownYear.get()) {
        shownYear.set(year);
        scheduleOnRN(onPreview, index, year);
      }
    },
    onDeactivate: (event) => {
      if (event.canceled) {
        position.set(withTiming(x, SNAP));
        scheduleOnRN(onCancel);
        return;
      }
      const year = origin + Math.round(position.get() / stepWidth);
      position.set(withTiming((year - origin) * stepWidth, SNAP));
      scheduleOnRN(onCommit, index, year);
    },
  });

  const placement = useAnimatedStyle(() => ({
    transform: [{ translateX: position.get() - HANDLE_SIZE / 2 }],
  }));

  const handleAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') onAdjust(index, 1);
    if (event.nativeEvent.actionName === 'decrement') onAdjust(index, -1);
  };
  // An end boundary is the year after the last one in the period; the reader hears the last.
  const year = isEnd ? value - 1 : value;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={LABELS[index]}
        accessibilityValue={{ text: String(year) }}
        accessibilityActions={ACTIONS}
        onAccessibilityAction={handleAction}
        style={[styles.hitArea, isEnd ? styles.below : styles.above, placement]}
      >
        <View
          style={[
            styles.stem,
            isEnd ? styles.stemBelow : styles.stemAbove,
            isPurchase ? styles.purchase : styles.coupon,
          ]}
        />
        <View style={[styles.knob, isPurchase ? styles.purchase : styles.coupon]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  hitArea: {
    position: 'absolute',
    left: 0,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  above: { top: 1 },
  below: { top: 45 },
  stem: { position: 'absolute', width: 2, height: 12 },
  stemAbove: { bottom: 0 },
  stemBelow: { top: 0 },
  knob: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 3,
    borderColor: theme.card,
  },
  purchase: { backgroundColor: theme.accentFill },
  coupon: { backgroundColor: theme.seriesRedemption },
}));
