import { type ReactNode, useRef } from 'react';
import { type HostInstance, type StyleProp, View, type ViewStyle } from 'react-native';

import { useClock } from '@shopify/react-native-skia';
import { useReducedMotion } from 'react-native-reanimated';

import { SkeletonGroupContext } from './skeletonGroupContext';

type Props = {
  /** What is on its way, read by screen readers in place of the blocks */
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * The frame of a skeleton: its blocks share one clock and one origin, so a single band of light
 * sweeps across all of them. With reduced motion the blocks stand still.
 */
export function SkeletonGroup({ label, style, children }: Props) {
  const clock = useClock();
  const reduceMotion = useReducedMotion();
  const origin = useRef<HostInstance>(null);

  return (
    <SkeletonGroupContext value={reduceMotion ? null : { clock, origin }}>
      <View
        ref={origin}
        style={style}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
      >
        {children}
      </View>
    </SkeletonGroupContext>
  );
}
