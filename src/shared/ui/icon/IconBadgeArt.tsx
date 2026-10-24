import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Shadow,
  SweepGradient,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { withAlpha } from '@/shared/lib';

/** One slow breath of the glow, and one turn of the orbit, in milliseconds */
const BREATH_PERIOD = 4000;
const ORBIT_PERIOD = 9000;

type Props = {
  /** Side of the square canvas; the glow reaches its edges */
  size: number;
  accent: string;
  surface: string;
  card: string;
};

/**
 * The drawing behind an illustration icon: a glow that breathes, a comet circling on a thin ring
 * and a lit disc for the glyph. With reduced motion it is still, with the comet at the top right.
 */
export function IconBadgeArt({ size, accent, surface, card }: Props) {
  const reduceMotion = useReducedMotion();
  const clock = useClock();
  const center = vec(size / 2, size / 2);
  const discRadius = size * 0.34;
  const ringRadius = size * 0.42;

  const glowRadius = useDerivedValue(() => {
    const breath = reduceMotion ? 1 : Math.sin((clock.get() / BREATH_PERIOD) * 2 * Math.PI);
    return size * (0.47 + breath * 0.03);
  });
  const orbit = useDerivedValue(() => [
    { rotate: reduceMotion ? -Math.PI / 4 : (clock.get() / ORBIT_PERIOD) * 2 * Math.PI },
  ]);

  return (
    <Canvas style={styles.canvas(size)}>
      <Circle c={center} r={glowRadius}>
        <RadialGradient
          c={center}
          r={glowRadius}
          colors={[surface, withAlpha(surface, 0)]}
          positions={[0.6, 1]}
        />
      </Circle>
      <Group transform={orbit} origin={center}>
        <Circle c={center} r={ringRadius} style="stroke" strokeWidth={1.5}>
          {/* The sweep brightens towards angle 0, where the comet's head is. */}
          <SweepGradient c={center} colors={[withAlpha(accent, 0), withAlpha(accent, 0.6)]} />
        </Circle>
        <Circle cx={center.x + ringRadius} cy={center.y} r={3.5} color={accent} />
      </Group>
      <Circle c={center} r={discRadius}>
        {/* Lit from the top left, like the cards' light. */}
        <RadialGradient
          c={vec(center.x - discRadius * 0.4, center.y - discRadius * 0.5)}
          r={discRadius * 1.6}
          colors={[card, surface]}
        />
        <Shadow dx={0} dy={4} blur={10} color={withAlpha(accent, 0.25)} />
      </Circle>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: (size: number) => ({ width: size, height: size }),
});
