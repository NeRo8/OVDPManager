import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import { completeOnboarding } from '@/features/onboarding';

import { Button } from '@/shared/ui';

import { ONBOARDING_SLIDES } from '../model/slides';

import { OnboardingBackdrop } from './OnboardingBackdrop';
import { OnboardingSlide } from './OnboardingSlide';
import { PagerDot } from './PagerDot';

const LAST_PAGE = ONBOARDING_SLIDES.length - 1;

// Skia takes colors as props, so the theme reaches the backdrop through withUnistyles.
const ThemedBackdrop = withUnistyles(OnboardingBackdrop);

/**
 * The introduction shown on the first launch: a slide per part of the app, swiped or stepped
 * through with «Далі». Finishing or skipping it lets the root layout's guard open the app.
 */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const pager = useAnimatedRef<Animated.ScrollView>();
  const position = useSharedValue(0);
  const shownPage = useSharedValue(0);
  const [page, setPage] = useState(0);
  const isLast = page === LAST_PAGE;

  const onScroll = useAnimatedScrollHandler((event) => {
    const current = event.contentOffset.x / width;
    position.set(current);
    // Also follows the «Далі» scroll, which ends without a momentum event on iOS.
    const nearest = Math.round(current);
    if (nearest !== shownPage.get()) {
      shownPage.set(nearest);
      scheduleOnRN(setPage, nearest);
    }
  });

  const showNext = () => {
    if (isLast) completeOnboarding();
    else pager.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  return (
    <View style={styles.screen}>
      <ThemedBackdrop
        position={position}
        uniProps={(theme) => ({
          accent: theme.accent,
          coupon: theme.seriesCoupon,
          redemption: theme.seriesRedemption,
        })}
      />
      {/* Kept in place on the last slide, so the slides do not shift up. */}
      <View
        style={[styles.topBar, isLast && styles.hidden]}
        accessibilityElementsHidden={isLast}
        importantForAccessibility={isLast ? 'no-hide-descendants' : 'auto'}
      >
        <Button
          title="Пропустити"
          variant="plain"
          onPress={completeOnboarding}
          style={styles.skip}
        />
      </View>
      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <OnboardingSlide key={slide.title} slide={slide} width={width} />
        ))}
      </Animated.ScrollView>
      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`Сторінка ${page + 1} з ${ONBOARDING_SLIDES.length}`}
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <PagerDot key={slide.title} index={index} position={position} />
        ))}
      </View>
      <View style={styles.actions}>
        <Button title={isLast ? 'Почати' : 'Далі'} onPress={showNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom + theme.space.md,
    gap: theme.space.xl,
  },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: theme.space.sm },
  skip: { paddingHorizontal: theme.space.md },
  pager: { flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: theme.space.sm },
  actions: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: theme.space.lg,
  },
  hidden: { opacity: 0, pointerEvents: 'none' },
}));
