import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

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
  const tone = payment.isPaid ? 'secondary' : 'primary';
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
        <Typography variant="callout" tone={tone} tabular>
          {formatDate(payment.date)}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {kind}
        </Typography>
      </View>
      <Typography
        variant="callout"
        weight="semibold"
        tabular
        tone={payment.type === 'coupon' && !payment.isPaid ? 'positive' : tone}
        style={styles.paymentAmount}
      >
        +{formatMoney(payment.total, payment.currency)}
      </Typography>
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
  paymentAmount: { flexShrink: 0 },
});
