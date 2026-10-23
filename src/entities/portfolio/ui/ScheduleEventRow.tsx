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
    <View style={[styles.row, isPaid && styles.paid]}>
      <Avatar label={event.currency ? currencySign(event.currency) : '?'} color={series} />
      <View style={styles.eventDetails}>
        {showIsin && (
          <Typography variant="callout" weight="semibold">
            {event.isin}
          </Typography>
        )}
        <Typography variant="caption1" tone="secondary">
          {kind}
        </Typography>
      </View>
      <View style={styles.eventAmount}>
        <Typography variant="caption1" tone={tone} tabular align="right">
          {formatDate(event.date)}
        </Typography>
        <Typography
          variant="callout"
          weight="semibold"
          tabular
          align="right"
          style={styles.amount(series)}
        >
          {isPurchase ? '−' : '+'}
          {formatMoney(event.total, event.currency)}
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
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  paid: { opacity: 0.6 },
  eventDetails: { gap: theme.space.xxs, flex: 1 },
  eventAmount: { gap: theme.space.xxs, flexShrink: 0 },
  // Amounts take the text-contrast step of the series hue.
  amount: (series: SeriesColor) => ({ color: theme[SERIES_COLORS[series].text] }),
}));
