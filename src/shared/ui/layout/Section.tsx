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
      <View style={styles.card}>{children}</View>
      {footer && (
        <Typography variant="caption1" tone="secondary" style={styles.sectionFooter}>
          {footer}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: 6 },
  sectionFooter: { lineHeight: 18, marginHorizontal: 16 },
  card: {
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: theme.card,
  },
}));
