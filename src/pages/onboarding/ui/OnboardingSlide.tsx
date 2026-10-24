import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { IconBadge, Typography } from '@/shared/ui';
import type { OnboardingSlideContent } from '../model/slides';

type Props = {
  slide: OnboardingSlideContent;
  /** A page of the pager, so the slide is as wide as it */
  width: number;
};

export function OnboardingSlide({ slide, width }: Props) {
  return (
    <View style={styles.slide(width)}>
      <IconBadge icon={slide.icon} size="lg" />
      <View style={styles.text}>
        <Typography variant="title2" align="center" accessibilityRole="header">
          {slide.title}
        </Typography>
        {/* Primary, not secondary: the backdrop's patches would take gray text below 4.5:1. */}
        <Typography variant="subhead" align="center">
          {slide.text}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  slide: (width: number) => ({
    width,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xxl,
    paddingHorizontal: theme.space.xxl,
  }),
  text: { maxWidth: 400, gap: theme.space.sm },
}));
