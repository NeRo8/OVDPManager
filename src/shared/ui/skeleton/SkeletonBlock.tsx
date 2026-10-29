import { useRef, useState } from 'react';
import { type DimensionValue, type HostInstance, type LayoutChangeEvent, View } from 'react-native';

import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { useSkeletonGroup } from './skeletonGroupContext';
import { SkeletonShimmer } from './SkeletonShimmer';

// Skia takes colors as props, so the theme reaches the band through withUnistyles.
const ThemedSkeletonShimmer = withUnistyles(SkeletonShimmer);

type Props = {
  width: DimensionValue;
  height: number;
  /** `circle` stands in for an Avatar; `bar` for a line of text or a figure */
  shape?: 'bar' | 'circle';
};

type Frame = { offset: number; width: number };

/**
 * A placeholder for a piece of content on its way: a muted bar or circle with a band of light
 * sweeping over it. It goes inside a `SkeletonGroup`, which times the band for all its blocks.
 */
export function SkeletonBlock({ width, height, shape = 'bar' }: Props) {
  const group = useSkeletonGroup();
  const block = useRef<HostInstance>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  // Measured against the group, not the window, so a screen sliding in does not shift the band.
  const measure = (event: LayoutChangeEvent) => {
    const blockWidth = event.nativeEvent.layout.width;
    const origin = group?.origin.current;
    if (!origin) return;
    block.current?.measureLayout(origin, (left) => setFrame({ offset: left, width: blockWidth }));
  };

  return (
    <View ref={block} onLayout={measure} style={styles.block(width, height, shape)}>
      {group && frame && (
        <ThemedSkeletonShimmer
          clock={group.clock}
          offset={frame.offset}
          width={frame.width}
          height={height}
          uniProps={(theme) => ({ highlight: theme.raised })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // No shadow here, so the block can clip the band to its corners.
  block: (width: DimensionValue, height: number, shape: 'bar' | 'circle') => ({
    width,
    height,
    borderRadius: shape === 'circle' ? theme.radius.full : theme.radius.xs,
    overflow: 'hidden',
    backgroundColor: theme.muted,
  }),
}));
