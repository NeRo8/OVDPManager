import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@/shared/lib';
import { useColors } from '@/shared/theme';
import { Swatch, Typography } from '@/shared/ui';

import type { ScheduleEvent } from '../model/ovdp';

const KINDS = {
  coupon: 'Купон',
  redemption: 'Погашення номіналу',
} as const;

type Props = {
  payment: ScheduleEvent;
  showIsin?: boolean;
  /** For positions bought in several purchases, where the quantity differs between payments */
  showQuantity?: boolean;
};

/** A payment received, or a purchase (money paid) when the event is one. */
export function PaymentRow({ payment, showIsin, showQuantity }: Props) {
  const colors = useColors();
  // Same colors as the schedule chart; amounts take the text-contrast step of the hue.
  const series = {
    coupon: { mark: colors.seriesCoupon, text: colors.seriesCouponText },
    redemption: { mark: colors.seriesNominal, text: colors.seriesNominalText },
    purchase: { mark: colors.seriesPurchase, text: colors.seriesPurchaseText },
  }[payment.type];
  const isPurchase = payment.type === 'purchase';
  const isPaid = !isPurchase && payment.isPaid;
  const tone = isPaid ? 'secondary' : 'primary';
  const kind = [
    isPurchase ? (payment.isTopUp ? 'Докупівля' : 'Купівля') : KINDS[payment.type],
    // A no-break space keeps "10 шт" on one line.
    (showQuantity || isPurchase) && `${payment.quantity} шт`,
    isPaid && 'виплачено',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, isPaid && styles.paid]}>
      <Swatch color={series.mark} />
      <View style={styles.paymentLeft}>
        {showIsin && (
          <Typography variant="callout" weight="semibold">
            {payment.isin}
          </Typography>
        )}
        <Typography variant="caption1" tone="secondary">
          {kind}
        </Typography>
      </View>
      <View style={styles.paymentRight}>
        <Typography variant="caption1" tone={tone} tabular align="right">
          {formatDate(payment.date)}
        </Typography>
        <Typography
          variant="callout"
          weight="semibold"
          tabular
          align="right"
          style={{ color: series.text }}
        >
          {isPurchase ? '−' : '+'}
          {formatMoney(payment.total, payment.currency)}
        </Typography>
      </View>
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
  paymentRight: { gap: 2, flexShrink: 0 },
});
