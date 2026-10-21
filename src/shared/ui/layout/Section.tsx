import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedSymbolView } from '../button/Button';
import { Typography } from '../typography/Typography';

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

export type SectionTextProps = {
  children: ReactNode;
};

/** A paragraph filling a section card. */
export function SectionText({ children }: SectionTextProps) {
  return (
    <Typography variant="subhead" style={styles.text}>
      {children}
    </Typography>
  );
}

export type SectionTitleProps = {
  title: string;
};

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <Typography variant="overline" tone="secondary" style={styles.sectionTitle}>
      {title}
    </Typography>
  );
}

export type SectionCellProps = {
  index: number;
  count: number;
  children: ReactNode;
};

/** One row of a section card whose rows are separate list cells. */
export function SectionCell({ index, count, children }: SectionCellProps) {
  return (
    <View
      style={[styles.cell, index === 0 && styles.firstCell, index === count - 1 && styles.lastCell]}
    >
      {index > 0 && <Separator />}
      {children}
    </View>
  );
}

export function Separator() {
  return <View style={styles.separator} />;
}

export type InfoRowProps = {
  label: string;
  value: ReactNode;
};

export function InfoRow({ label, value }: InfoRowProps) {
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

export type LinkRowProps = {
  title: string;
  onPress: () => void;
};

/** A section row that opens another screen. */
export function LinkRow({ title, onPress }: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Typography variant="body" style={styles.linkTitle}>
        {title}
      </Typography>
      <ThemedSymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={14}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: theme.secondaryText })}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: 6 },
  sectionFooter: { lineHeight: 18, marginHorizontal: 16 },
  sectionTitle: { marginHorizontal: 16 },
  text: { paddingHorizontal: 16, paddingVertical: 14, lineHeight: 21 },
  card: {
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: theme.card,
  },
  cell: { overflow: 'hidden', borderCurve: 'continuous', backgroundColor: theme.card },
  firstCell: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastCell: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: theme.border },
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
  linkTitle: { flexShrink: 1 },
  pressed: { backgroundColor: theme.muted },
}));
