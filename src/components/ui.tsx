import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { formatDate, formatMoney } from '@/lib/format';
import type { PositionPayment } from '@/lib/ovdp';
import { useColors } from '@/theme/colors';

export function Section({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      {title && <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{title}</Text>}
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
      {footer && (
        <Text style={[styles.sectionFooter, { color: colors.secondaryText }]}>{footer}</Text>
      )}
    </View>
  );
}

export function Separator() {
  const colors = useColors();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.value, { color: colors.text }]} selectable>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function PaymentRow({
  payment,
  showIsin,
  showQuantity,
}: {
  payment: PositionPayment;
  showIsin?: boolean;
  /** For positions bought in several purchases, where the quantity differs between payments */
  showQuantity?: boolean;
}) {
  const colors = useColors();
  const tone = payment.isPaid ? colors.secondaryText : colors.text;
  const kind = [
    showIsin && payment.isin,
    payment.type === 'redemption' ? 'Погашення номіналу' : 'Купон',
    showQuantity && `${payment.quantity} шт`,
    payment.isPaid && 'виплачено',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, payment.isPaid && styles.paid]}>
      <View style={styles.paymentLeft}>
        <Text style={[styles.paymentDate, { color: tone }]}>{formatDate(payment.date)}</Text>
        <Text style={[styles.caption, { color: colors.secondaryText }]}>{kind}</Text>
      </View>
      <Text
        style={[
          styles.paymentAmount,
          { color: payment.type === 'coupon' && !payment.isPaid ? colors.positive : tone },
        ]}
      >
        +{formatMoney(payment.total, payment.currency)}
      </Text>
    </View>
  );
}

export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.headerButtonText, { color: colors.accent }]}>{title}</Text>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.accent : colors.card,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: isPrimary
              ? colors.accentText
              : variant === 'destructive'
                ? colors.danger
                : colors.accent,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/** Scroll content: phone-width column, centered on wide (web/tablet) screens. */
export const screenContent: ViewStyle = {
  width: '100%',
  maxWidth: 640,
  alignSelf: 'center',
  padding: 16,
  paddingBottom: 48,
  gap: 24,
};

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
  paid: { opacity: 0.6 },
  paymentLeft: { gap: 2, flex: 1 },
  paymentDate: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 13 },
  paymentAmount: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 0 },
  // Native headers pad their items; the web header does not.
  headerButton: { paddingHorizontal: Platform.OS === 'web' ? 16 : 0 },
  headerButtonText: { fontSize: 17, fontWeight: '500' },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
});
