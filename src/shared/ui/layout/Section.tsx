import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { themeStyles } from '@/shared/theme';
import { Typography } from '../typography/Typography';

export function Section({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const theme = themeStyles;
  return (
    <View style={styles.section}>
      {title && <SectionTitle title={title} />}
      <View style={[styles.card, theme.card]}>{children}</View>
      {footer && (
        <Typography variant="caption1" tone="secondary" style={styles.sectionFooter}>
          {footer}
        </Typography>
      )}
    </View>
  );
}

/** A paragraph filling a section card. */
export function SectionText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subhead" style={styles.text}>
      {children}
    </Typography>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <Typography variant="overline" tone="secondary" style={styles.sectionTitle}>
      {title}
    </Typography>
  );
}

/** One row of a section card whose rows are separate list cells. */
export function SectionCell({
  index,
  count,
  children,
}: {
  index: number;
  count: number;
  children: ReactNode;
}) {
  const theme = themeStyles;
  return (
    <View
      style={[
        styles.cell,
        theme.card,
        index === 0 && styles.firstCell,
        index === count - 1 && styles.lastCell,
      ]}
    >
      {index > 0 && <Separator />}
      {children}
    </View>
  );
}

export function Separator() {
  const theme = themeStyles;
  return <View style={[styles.separator, theme.borderBackground]} />;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.row}>
      <Typography variant="subhead" tone="secondary">
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="subhead" weight="medium" style={styles.value} selectable>
          {value}
        </Typography>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  sectionFooter: { lineHeight: 18, marginHorizontal: 16 },
  sectionTitle: { marginHorizontal: 16 },
  text: { paddingHorizontal: 16, paddingVertical: 14, lineHeight: 21 },
  card: { borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden' },
  cell: { overflow: 'hidden', borderCurve: 'continuous' },
  firstCell: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastCell: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
