import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { BUBBLE_TURN, type Bubble } from './splashMotion';

type Props = {
  bubble: Bubble;
  /** 0 → 1 over the whole gathering */
  gather: SharedValue<number>;
};

/** One bubble spiralling from its start position into the center, where it fades out. */
export function SplashBubble({ bubble, gather }: Props) {
  const motion = useAnimatedStyle(() => {
    const progress = interpolate(gather.get(), [bubble.delay, 1], [0, 1], Extrapolation.CLAMP);
    const angle = bubble.angle + progress * BUBBLE_TURN;
    const distance = bubble.distance * (1 - progress);
    return {
      opacity: bubble.opacity * interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: interpolate(progress, [0, 1], [1, 0.4]) },
      ],
    };
  });

  return <Animated.View style={[styles.bubble(bubble.size), motion]} />;
}

const styles = StyleSheet.create((theme) => ({
  // Out of the flow: the splash centers it, and the transform carries it around that center.
  bubble: (size: number) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: theme.radius.full,
    backgroundColor: theme.headerText,
  }),
}));
