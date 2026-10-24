import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';
import { SectionTitle } from './SectionTitle';

export type SectionProps = {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function Section({ title, footer, children }: SectionProps) {
  return (
    <View style={styles.section}>
      {title && <SectionTitle title={title} />}
      <View style={styles.card}>
        <View style={styles.clip}>{children}</View>
      </View>
      {footer && (
        <Typography variant="caption1" tone="secondary" style={styles.sectionFooter}>
          {footer}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  sectionFooter: { lineHeight: 18, marginHorizontal: theme.space.lg },
  // The shadow and the clipping sit on separate views, so the clip cannot cut the shadow off.
  card: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.card,
    boxShadow: theme.shadowCard,
  },
  clip: { borderRadius: theme.radius.md, borderCurve: 'continuous', overflow: 'hidden' },
}));
