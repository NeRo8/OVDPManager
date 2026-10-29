import { type ReactNode, useEffect, useState } from 'react';

import { useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import type { ParamListBase } from 'expo-router/react-navigation';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenSkeleton, type ScreenSkeletonVariant } from '../skeleton/ScreenSkeleton';

type Props = {
  /** The shape of the screen's skeleton */
  skeleton: ScreenSkeletonVariant;
  children: ReactNode;
};

/**
 * A screen opened over another: it slides in as its skeleton, which draws at once, and its content
 * mounts once the transition has ended, fading in. The first screen of a stack has no transition
 * and shows its content straight away.
 */
export function DeferredScreen({ skeleton, children }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [ready, setReady] = useState(() => (navigation.getState()?.index ?? 0) === 0);

  useEffect(() => {
    if (ready) return;
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) setReady(true);
    });
  }, [navigation, ready]);

  if (!ready) return <ScreenSkeleton variant={skeleton} />;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
