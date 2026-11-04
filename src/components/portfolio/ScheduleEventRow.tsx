import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Avatar } from '@/components/avatar/Avatar';
import { ListRow } from '@/components/layout/ListRow';
import { Money } from '@/components/typography/Money';
import { SignedValue } from '@/components/typography/SignedValue';
import { Typography } from '@/components/typography/Typography';
import { type ScheduleEvent, awaitsConfirmation, isReceived } from '@/lib/portfolio/portfolio';
import { useToday } from '@/stores/appSettings';
import { SERIES_COLORS, type SeriesColor } from '@/theme/series';
import { daysBetween, formatDate, formatDaysLeft } from '@/utils/date';
import { currencySign, signPrefix } from '@/utils/format';

const KINDS = {
  coupon: 'Купон',
  redemption: 'Погашення',
  sale: 'Продаж',
} as const;

const purchaseKind = (isTopUp: boolean) => (isTopUp ? 'Докупівля' : 'Купівля');

/** Same colors as the schedule chart. */
const SERIES = {
  coupon: 'coupon',
  redemption: 'redemption',
  purchase: 'purchase',
  sale: 'sale',
} as const satisfies Record<ScheduleEvent['type'], SeriesColor>;

type Props = {
  event: ScheduleEvent;
  showIsin?: boolean;
  /** For positions bought in several operations, where the quantity differs between payments */
  showQuantity?: boolean;
};

/**
 * A payment, a purchase (money paid) or a sale (money received). A payment still ahead says how
 * many days are left until it; a planned operation, and a payment for bonds still only planned,
 * say so, and once their date has come without a confirmation, that they wait for one.
 */
export function ScheduleEventRow({ event, showIsin, showQuantity }: Props) {
  const today = useToday();
  const series = SERIES[event.type];
  const isPurchase = event.type === 'purchase';
  const isOperation = 'id' in event;
  const isPaid = isOperation ? event.type === 'sale' && !event.planned : isReceived(event);
  const isUpcoming = isOperation ? event.date > today : !event.isPaid;
  const awaiting = isOperation
    ? awaitsConfirmation(event, today)
    : event.isPaid && event.plannedQuantity > 0;
  const signedTotal = isPurchase ? -event.total : event.total;
  const sign = signPrefix(signedTotal);
  const tone = isPaid ? 'secondary' : 'primary';
  const planned = isOperation
    ? event.planned && 'заплановано'
    : event.plannedQuantity > 0 &&
      (event.plannedQuantity === event.quantity
        ? 'заплановано'
        : `${event.plannedQuantity} з ${event.quantity} шт заплановано`);
  const kindLabel = event.type === 'purchase' ? purchaseKind(event.isTopUp) : KINDS[event.type];
  const kind = [
    kindLabel,
    // A no-break space keeps "10 шт" on one line.
    (showQuantity || isOperation) && `${event.quantity} шт`,
    isPaid && 'отримано',
    isUpcoming && formatDaysLeft(daysBetween(today, event.date)),
    planned,
    awaiting && 'чекає підтвердження',
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
            <Money value={event.total} currency={event.currency} />
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
