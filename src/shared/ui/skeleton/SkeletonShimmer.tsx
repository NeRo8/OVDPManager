import { useWindowDimensions } from 'react-native';

import { Canvas, LinearGradient, Rect } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { withAlpha } from '@/shared/lib';

/** One sweep across the screen, then a pause before the next, in milliseconds */
const SWEEP = 1200;
const PERIOD = 1800;

type Props = {
  clock: SharedValue<number>;
  /** The block's left edge from the group's, so the band crosses every block at the same moment */
  offset: number;
  width: number;
  height: number;
  highlight: string;
};

/**
 * The band of light that sweeps over a skeleton block (Skia). It moves across the width of the
 * screen, so blocks side by side light up one after the other, as if under one light.
 */
export function SkeletonShimmer({ clock, offset, width, height, highlight }: Props) {
  const { width: span } = useWindowDimensions();
  const band = span * 0.4;

  // The band's left edge in the block's own coordinates.
  const start = useDerivedValue(() => {
    const progress = Math.min((clock.get() % PERIOD) / SWEEP, 1);
    return { x: -band + progress * (span + band) - offset, y: 0 };
  });
  const end = useDerivedValue(() => ({ x: start.get().x + band, y: 0 }));

  return (
    <Canvas style={styles.canvas}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={start}
          end={end}
          colors={[withAlpha(highlight, 0), withAlpha(highlight, 0.9), withAlpha(highlight, 0)]}
        />
      </Rect>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: StyleSheet.absoluteFillObject,
});
