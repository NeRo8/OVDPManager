import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ExchangeCurrency } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';
import type { FxEvent } from '../model/fxReport';

type Props = { event: FxEvent; currency: ExchangeCurrency };

const NAMES = { purchase: 'Купівля', coupon: 'Купон', redemption: 'Погашення' } as const;
const rateFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/** One past hryvnia flow and its foreign currency equivalent at the rate on that day. */
export function FxEventRow({ event, currency }: Props) {
  const isPurchase = event.type === 'purchase';
  return (
    <View style={styles.row}>
      <View style={styles.details}>
        <Typography variant="callout" weight="medium">
          {NAMES[event.type]} · {formatDate(event.date)}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {formatMoney(event.amount, 'UAH')} · курс {rateFormat.format(event.rate)} ₴/{currency}
        </Typography>
      </View>
      <Typography variant="callout" weight="semibold" tabular align="right">
        {isPurchase ? '−' : '+'}
        {formatMoney(event.equivalent, currency)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  details: { flex: 1, gap: theme.space.xxs },
}));
