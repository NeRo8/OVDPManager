import { useRef, useState } from 'react';
import { Image } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import { SplashBubble } from './SplashBubble';
import {
  BUBBLES,
  EASE_IN_OUT,
  EASE_OUT,
  EXIT_DELAY,
  EXIT_DURATION,
  GATHER_DURATION,
  LOGO_SIZE,
  LOGO_SPIN,
  REDUCED_EXIT_DELAY,
  REDUCED_SWIRL_DURATION,
  SWIRL_DELAY,
  SWIRL_DURATION,
} from './splashMotion';
import { SplashRing } from './SplashRing';

// Reduced motion is handled here: the splash drops the bubbles and the spin and keeps the fades.
const ALWAYS = ReduceMotion.Never;

const LOGO = require('../../config/app-icon/splash-icon.png');

/**
 * Takes over from the native splash on the same teal: bubbles gather in the center, the logo spins
 * out of their whirlpool, and the splash fades into the app that rendered underneath it.
 */
export function LaunchSplash() {
  const reduceMotion = useReducedMotion();
  const [isFinished, setFinished] = useState(false);
  const hasStarted = useRef(false);
  const gather = useSharedValue(0);
  const swirl = useSharedValue(0);
  const exit = useSharedValue(0);

  const finish = () => setFinished(true);

  // The first layout puts the overlay on screen, so the native splash can go without a blank frame.
  const start = () => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    SplashScreen.hide();
    if (!reduceMotion) {
      gather.set(
        withTiming(1, { duration: GATHER_DURATION, easing: EASE_IN_OUT, reduceMotion: ALWAYS }),
      );
    }
    swirl.set(
      withDelay(
        reduceMotion ? 0 : SWIRL_DELAY,
        withTiming(1, {
          duration: reduceMotion ? REDUCED_SWIRL_DURATION : SWIRL_DURATION,
          easing: EASE_OUT,
          reduceMotion: ALWAYS,
        }),
        ALWAYS,
      ),
    );
    exit.set(
      withDelay(
        reduceMotion ? REDUCED_EXIT_DELAY : EXIT_DELAY,
        withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT, reduceMotion: ALWAYS }, () => {
          'worklet';
          // Even an interrupted fade removes the splash, so it can never stay over the app.
          scheduleOnRN(finish);
        }),
        ALWAYS,
      ),
    );
  };

  const overlayMotion = useAnimatedStyle(() => ({ opacity: 1 - exit.get() }));

  const logoMotion = useAnimatedStyle(() => {
    const progress = swirl.get();
    const opacity = interpolate(progress, [0, 0.4], [0, 1], Extrapolation.CLAMP);
    if (reduceMotion) return { opacity };
    return {
      opacity,
      transform: [
        { rotate: `${(progress - 1) * LOGO_SPIN}deg` },
        { scale: interpolate(progress, [0, 1], [0.5, 1]) * (1 + exit.get() * 0.08) },
      ],
    };
  });

  if (isFinished) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayMotion]}
      onLayout={start}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Light on the teal; once the splash is gone the status bar follows the app's theme again. */}
      <StatusBar style="light" />
      {!reduceMotion && (
        <>
          <SplashRing size={LOGO_SIZE * 0.95} turns={2} swirl={swirl} />
          <SplashRing size={LOGO_SIZE * 0.7} turns={3} swirl={swirl} />
          {BUBBLES.map((bubble, index) => (
            <SplashBubble key={index} bubble={bubble} gather={gather} />
          ))}
        </>
      )}
      <Animated.View style={logoMotion}>
        <Image source={LOGO} style={styles.logo} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The native splash color, so the hand-over from it shows no seam.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.headerBackground,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
}));
