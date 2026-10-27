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
import { Avatar, ListRow, SignedValue, Typography } from '@/shared/ui';

import type { ScheduleEvent } from '../model/portfolio';

const KINDS = {
  coupon: 'Купон',
  redemption: 'Погашення',
} as const;

/** Same colors as the schedule chart. */
const SERIES = {
  coupon: 'coupon',
  redemption: 'redemption',
  purchase: 'purchase',
} as const satisfies Record<ScheduleEvent['type'], SeriesColor>;

type Props = {
  event: ScheduleEvent;
  showIsin?: boolean;
  /** For positions bought in several purchases, where the quantity differs between payments */
  showQuantity?: boolean;
};

/**
 * A payment, or a purchase (money paid) when the event is one. A payment still ahead says how
 * many days are left until it.
 */
export function ScheduleEventRow({ event, showIsin, showQuantity }: Props) {
  const series = SERIES[event.type];
  const isPurchase = event.type === 'purchase';
  const isPaid = !isPurchase && event.isPaid;
  const isUpcoming = !isPurchase && !event.isPaid;
  const signedTotal = isPurchase ? -event.total : event.total;
  const sign = signedTotal > 0 ? '+' : signedTotal < 0 ? '−' : '';
  const tone = isPaid ? 'secondary' : 'primary';
  const kind = [
    isPurchase ? (event.isTopUp ? 'Докупівля' : 'Купівля') : KINDS[event.type],
    // A no-break space keeps "10 шт" on one line.
    (showQuantity || isPurchase) && `${event.quantity} шт`,
    isPaid && 'отримано',
    isUpcoming && formatDaysLeft(daysBetween(todayISO(), event.date)),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      style={isPaid && styles.paid}
      // The avatar keeps the event type's series color; the amount follows its sign.
      leading={<Avatar label={currencySign(event.currency)} color={SERIES_COLORS[series].badge} />}
      title={
        showIsin && (
          <Typography variant="callout" weight="semibold">
            {event.isin}
          </Typography>
        )
      }
      subtitle={kind}
      trailing={
        <View style={styles.amount}>
          <Typography variant="caption1" tone={tone} tabular align="right">
            {formatDate(event.date)}
          </Typography>
          <SignedValue
            value={signedTotal}
            variant="callout"
            weight="semibold"
            tabular
            align="right"
          >
            {sign}
            {formatMoney(event.total, event.currency)}
          </SignedValue>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  paid: { opacity: 0.6 },
  amount: { gap: theme.space.xxs, flexShrink: 0 },
}));
