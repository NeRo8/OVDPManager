import { Circle, useClock } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue, useReducedMotion } from 'react-native-reanimated';

import type { Blob } from '../model/aurora';

type Props = {
  blob: Blob;
  color: string;
  width: number;
  height: number;
  /** The pager's scroll position in pages */
  position: SharedValue<number>;
};

/** One soft patch of color, drifting on its own loop and sliding a little with the pages. */
export function AuroraBlob({ blob, color, width, height, position }: Props) {
  const reduceMotion = useReducedMotion();
  const clock = useClock();

  const cx = useDerivedValue(() => {
    const drift = reduceMotion ? 0 : Math.sin(clock.get() / blob.period + blob.phase);
    return width * (blob.x + drift * blob.drift - position.get() * blob.parallax);
  });
  const cy = useDerivedValue(() => {
    const drift = reduceMotion ? 0 : Math.cos(clock.get() / blob.period + blob.phase);
    return height * blob.y + width * drift * blob.drift;
  });

  return <Circle cx={cx} cy={cy} r={width * blob.radius} color={color} />;
}
