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
  subtitle?: string;
  onPress: () => void;
};

/** A section row that opens another screen. */
export function LinkRow({ title, subtitle, onPress }: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption1" tone="secondary">
            {subtitle}
          </Typography>
        )}
      </View>
      <ThemedSymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={14}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: theme.secondaryText })}
      />
    </Pressable>
  );
}

export type ActionRowProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

/** A section row that does something in place, unlike LinkRow, which opens another screen. */
export function ActionRow({ title, onPress, disabled }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, disabled ? styles.disabled : pressed && styles.pressed]}
    >
      <Typography variant="body" tone="accent">
        {title}
      </Typography>
    </Pressable>
  );
}

export type CheckRowProps = {
  title: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
};

/** A section row that is switched on and off, marked with a check. */
export function CheckRow({ title, subtitle, checked, onPress }: CheckRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption1" tone="secondary">
            {subtitle}
          </Typography>
        )}
      </View>
      {checked && (
        <ThemedSymbolView
          name={{ ios: 'checkmark', android: 'check' }}
          size={17}
          weight="semibold"
          uniProps={(theme) => ({ tintColor: theme.accent })}
        />
      )}
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
  rowText: { flexShrink: 1, gap: 2 },
  pressed: { backgroundColor: theme.muted },
  disabled: { opacity: 0.4 },
}));
