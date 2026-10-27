import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { SectionFrame, type SectionFrameProps } from './SectionFrame';

type Props = SectionFrameProps & {
  children: ReactNode;
};

/**
 * Padded card of free content, such as a headline figure with its details or a chart, under an
 * optional title and over an optional footer, as a Section is.
 */
export function Card({ title, footer, children }: Props) {
  return (
    <SectionFrame title={title} footer={footer}>
      <View style={styles.card}>{children}</View>
    </SectionFrame>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    boxShadow: theme.shadowCard,
    padding: theme.space.lg,
    gap: theme.space.xs,
    backgroundColor: theme.card,
  },
}));
