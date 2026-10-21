import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  currencySign,
  daysBetween,
  formatDate,
  formatDaysLeft,
  formatMoney,
  todayISO,
} from '@/shared/lib';
import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import { Avatar, Typography } from '@/shared/ui';

import type { ScheduleEvent } from '../model/ovdp';

const KINDS = {
  coupon: 'Купон',
  redemption: 'Погашення номіналу',
} as const;

/** Same colors as the schedule chart. */
const SERIES = {
  coupon: 'coupon',
  redemption: 'nominal',
  purchase: 'purchase',
} as const satisfies Record<ScheduleEvent['type'], SeriesColor>;

type Props = {
  payment: ScheduleEvent;
  showIsin?: boolean;
  /** For positions bought in several purchases, where the quantity differs between payments */
  showQuantity?: boolean;
};

/**
 * A payment, or a purchase (money paid) when the event is one. A payment still ahead says how
 * many days are left until it.
 */
export function PaymentRow({ payment, showIsin, showQuantity }: Props) {
  const series = SERIES[payment.type];
  const isPurchase = payment.type === 'purchase';
  const isPaid = !isPurchase && payment.isPaid;
  const isUpcoming = !isPurchase && !payment.isPaid;
  const tone = isPaid ? 'secondary' : 'primary';
  const kind = [
    isPurchase ? (payment.isTopUp ? 'Докупівля' : 'Купівля') : KINDS[payment.type],
    // A no-break space keeps "10 шт" on one line.
    (showQuantity || isPurchase) && `${payment.quantity} шт`,
    isPaid && 'виплачено',
    isUpcoming && formatDaysLeft(daysBetween(todayISO(), payment.date)),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, isPaid && styles.paid]}>
      <Avatar label={currencySign(payment.currency)} color={series} />
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
          style={styles.amount(series)}
        >
          {isPurchase ? '−' : '+'}
          {formatMoney(payment.total, payment.currency)}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  // Amounts take the text-contrast step of the series hue.
  amount: (series: SeriesColor) => ({ color: theme[SERIES_COLORS[series].text] }),
}));
