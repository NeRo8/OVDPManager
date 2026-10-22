import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ScheduleEvent } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

type Props = { event: ScheduleEvent };

export function PlanEventRow({ event }: Props) {
  const isPurchase = event.type === 'purchase';
  const label = isPurchase
    ? 'Запланована купівля'
    : event.type === 'coupon'
      ? 'Купон'
      : 'Погашення номіналу';
  return (
    <View style={styles.row}>
      <View style={styles.details}>
        <Typography variant="callout" weight="semibold" tabular>
          {event.isin}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {label} · {event.quantity} шт
        </Typography>
      </View>
      <View style={styles.amount}>
        <Typography variant="caption1" tone="secondary" tabular align="right">
          {formatDate(event.date)}
        </Typography>
        <Typography variant="callout" weight="semibold" tabular align="right">
          {isPurchase ? '−' : '+'}
          {formatMoney(event.total, event.currency)}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  details: { flex: 1, gap: 2 },
  amount: { gap: 2 },
});
