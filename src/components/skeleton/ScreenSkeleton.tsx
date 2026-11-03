import { StyleSheet } from 'react-native-unistyles';

import { ScreenScrollView } from '@/components/layout/ScreenScrollView';

import { SkeletonCard } from './SkeletonCard';
import { SkeletonChoices } from './SkeletonChoices';
import { SkeletonGroup } from './SkeletonGroup';
import { SkeletonSection } from './SkeletonSection';

/**
 * The shapes of the app's screens: `list` a card over rows (the bond card, the picker, the plans),
 * `form` sections of fields, `filters` sections of choices.
 */
export type ScreenSkeletonVariant = 'list' | 'form' | 'filters';

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

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
