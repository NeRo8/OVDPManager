import { StyleSheet } from 'react-native-unistyles';

import { SkeletonCard } from '../skeleton/SkeletonCard';
import { SkeletonGroup } from '../skeleton/SkeletonGroup';
import { SkeletonSection } from '../skeleton/SkeletonSection';
import { ScreenScrollView } from './ScreenScrollView';

export type LoadingStateProps = {
  /** What the screen waits for, read by screen readers in place of the skeleton */
  message: string;
};

/** The skeleton of a screen while its data is on its way: a card of figures over a list of rows. */
export function LoadingState({ message }: LoadingStateProps) {
  return (
    <SkeletonGroup label={message} style={styles.screen}>
      <ScreenScrollView scrollEnabled={false}>
        <SkeletonCard />
        <SkeletonSection rows={5} />
      </ScreenScrollView>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
