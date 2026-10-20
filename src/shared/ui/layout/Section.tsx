import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themeStyles } from '@/shared/theme';

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
      {title && <Text style={[styles.sectionTitle, theme.secondaryText]}>{title}</Text>}
      <View style={[styles.card, theme.card]}>{children}</View>
      {footer && <Text style={[styles.sectionFooter, theme.secondaryText]}>{footer}</Text>}
    </View>
  );
}

export function Separator() {
  const theme = themeStyles;
  return <View style={[styles.separator, theme.borderBackground]} />;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  const theme = themeStyles;
  return (
    <View style={styles.row}>
      <Text style={[styles.label, theme.secondaryText]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.value, theme.text]} selectable>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  sectionFooter: { fontSize: 13, lineHeight: 18, marginHorizontal: 16 },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginHorizontal: 16,
  },
  card: { borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden' },
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
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
});
