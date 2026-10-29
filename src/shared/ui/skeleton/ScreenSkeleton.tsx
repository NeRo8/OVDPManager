import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Card } from '../layout/Card';
import { ScreenScrollView } from '../layout/ScreenScrollView';

import { SkeletonBlock } from './SkeletonBlock';
import { SkeletonCard } from './SkeletonCard';
import { SkeletonChoices } from './SkeletonChoices';
import { SkeletonGroup } from './SkeletonGroup';
import { SkeletonSection } from './SkeletonSection';

/**
 * The shapes of the app's screens: `list` a card over rows (the bond card, the picker, the plans),
 * `report` a heading, figures, a chart and rows, `form` sections of fields, `filters` sections of
 * choices.
 */
export type ScreenSkeletonVariant = 'list' | 'report' | 'form' | 'filters';

type Props = {
  variant: ScreenSkeletonVariant;
  /** What is on its way, read by screen readers in place of the skeleton */
  label?: string;
};

/** The skeleton of a whole screen in the shape of its content, while it is on its way. */
export function ScreenSkeleton({ variant, label = 'Завантаження…' }: Props) {
  return (
    <SkeletonGroup label={label} style={styles.screen}>
      <ScreenScrollView scrollEnabled={false}>
        {variant === 'list' && (
          <>
            <SkeletonCard />
            <SkeletonSection rows={6} />
          </>
        )}
        {variant === 'report' && (
          <>
            <View style={styles.heading}>
              <SkeletonBlock width="50%" height={22} />
              <SkeletonBlock width="75%" height={12} />
            </View>
            <SkeletonCard />
            <Card>
              <SkeletonBlock width="100%" height={160} />
            </Card>
            <SkeletonSection rows={4} />
          </>
        )}
        {variant === 'form' && (
          <>
            <SkeletonChoices rows={3} trailing="field" />
            <SkeletonChoices rows={2} trailing="field" />
          </>
        )}
        {variant === 'filters' && (
          <>
            <SkeletonChoices rows={2} trailing="check" />
            <SkeletonChoices rows={3} trailing="check" />
            <SkeletonChoices rows={4} trailing="check" />
          </>
        )}
      </ScreenScrollView>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  heading: { gap: theme.space.sm, paddingHorizontal: theme.space.lg },
}));
