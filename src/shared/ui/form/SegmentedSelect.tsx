import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { hasLiquidGlass } from '@/shared/lib';
import { space } from '@/shared/theme';
import { ThemedGlassView } from '../glass/ThemedGlassView';
import { Typography } from '../typography/Typography';

/** The track's inset around the thumb; segments share the rest of its width equally. */
const TRACK_PADDING = space.xs;
// The thumb moves across the control, so it eases in and out rather than out only.
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

type Option<T extends string | number> = { label: string; value: T };

export type SegmentedSelectProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * One choice out of a few, marked by a thumb that slides to the selected segment. With Liquid
 * Glass the track is a glass capsule and the thumb accent-tinted glass; elsewhere the thumb is
 * a solid accent.
 */
export function SegmentedSelect<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedSelectProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const thumbX = useSharedValue(0);
  const isThumbPlaced = useRef(false);

  useEffect(() => {
    if (!segmentWidth || selectedIndex < 0) return;
    const target = selectedIndex * segmentWidth;
    // The first placement jumps, so the thumb does not slide in from the left on mount.
    if (!isThumbPlaced.current) {
      thumbX.set(target);
      isThumbPlaced.current = true;
      return;
    }
    thumbX.set(
      withTiming(target, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }),
    );
  }, [selectedIndex, segmentWidth, thumbX]);

  const thumbMotion = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.get() }] }));
  const measureTrack = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={measureTrack} accessibilityRole="radiogroup">
      {hasLiquidGlass && <ThemedGlassView style={styles.trackGlass} />}
      {segmentWidth > 0 && selectedIndex >= 0 && (
        // The glass moves with its parent: a transform, never an opacity, keeps it drawn right.
        <Animated.View style={[styles.thumb(segmentWidth), thumbMotion]}>
          {hasLiquidGlass && (
            <ThemedGlassView
              uniProps={(theme) => ({ tintColor: theme.accent })}
              style={styles.thumbGlass}
            />
          )}
        </Animated.View>
      )}
      {options.map((option) => {
        const selected = option.value === value;
        const select = () => onChange(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={select}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.option, pressed && !selected && styles.pressed]}
          >
            <Typography
              variant="footnote"
              weight={selected ? 'semibold' : 'medium'}
              align="center"
              tone={selected ? 'onAccent' : 'secondary'}
              numberOfLines={1}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// Glass is a capsule like the system's controls; the solid thumb keeps the card's rounder corners.
const THUMB_RADIUS = hasLiquidGlass ? 'full' : 'sm';

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
  },
  trackGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.full,
  },
  // Out of the flow, so moving it re-lays-out nothing.
  thumb: (width: number) => ({
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    width,
    borderRadius: theme.radius[THUMB_RADIUS],
    borderCurve: 'continuous',
    ...(!hasLiquidGlass && { backgroundColor: theme.accent, boxShadow: theme.shadowCard }),
  }),
  thumbGlass: { flex: 1, borderRadius: theme.radius.full },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
