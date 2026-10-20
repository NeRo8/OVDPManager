import { StyleSheet, Text, View } from 'react-native';

import { formatDate, formatMoney } from '@/shared/lib';
import { themeStyles } from '@/shared/theme';

import type { PositionPayment } from '../model/ovdp';

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
  const theme = themeStyles;
  const tone = payment.isPaid ? theme.secondaryText : theme.text;
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
        <Text style={[styles.paymentDate, tone]}>{formatDate(payment.date)}</Text>
        <Text style={[styles.caption, theme.secondaryText]}>{kind}</Text>
      </View>
      <Text
        style={[
          styles.paymentAmount,
          payment.type === 'coupon' && !payment.isPaid ? theme.positiveText : tone,
        ]}
      >
        +{formatMoney(payment.total, payment.currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  paid: { opacity: 0.6 },
  paymentLeft: { gap: 2, flex: 1 },
  paymentDate: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 13 },
  paymentAmount: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 0 },
});
