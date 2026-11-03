import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  index: number;
  /** The pager's scroll position in pages, fractional while it moves */
  position: SharedValue<number>;
};

/** One page indicator; the current page's dot stretches and lights up as the pager reaches it. */
export function PagerDot({ index, position }: Props) {
  const motion = useAnimatedStyle(() => {
    const nearness = interpolate(
      position.get(),
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { width: interpolate(nearness, [0, 1], [8, 24]), opacity: 0.3 + nearness * 0.7 };
  });

  return <Animated.View style={[styles.dot, motion]} />;
}

const styles = StyleSheet.create((theme) => ({
  dot: { height: 8, borderRadius: theme.radius.full, backgroundColor: theme.accent },
}));
