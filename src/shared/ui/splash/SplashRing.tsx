import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  size: number;
  /** Extra half-turns over the swirl; rings with more of them read as the faster inner water */
  turns: number;
  /** 0 → 1 while the logo spins in */
  swirl: SharedValue<number>;
};

/** An open arc of the whirlpool: it spins around the logo, widens and fades. */
export function SplashRing({ size, turns, swirl }: Props) {
  const motion = useAnimatedStyle(() => {
    const progress = swirl.get();
    return {
      opacity: interpolate(progress, [0, 0.3, 1], [0, 0.7, 0]),
      transform: [
        { rotate: `${progress * turns * 180}deg` },
        { scale: interpolate(progress, [0, 1], [0.5, 1.3]) },
      ],
    };
  });

  return <Animated.View style={[styles.ring(size), motion]} />;
}

const styles = StyleSheet.create((theme) => ({
  // Two coloured sides of a circle's border draw a half-open arc.
  ring: (size: number) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: theme.radius.full,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: theme.headerText,
    borderLeftColor: theme.headerMutedText,
  }),
}));
