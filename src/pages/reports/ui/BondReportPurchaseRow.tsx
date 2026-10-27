import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  type Currency,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
} from '@/entities/portfolio';
import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { SERIES_COLORS } from '@/shared/theme';
import { Avatar, Typography } from '@/shared/ui';

type Props = {
  purchase: Purchase;
  currency: Currency;
  today: string;
};

/** One purchase of the bond: when, how many and for how much. */
export function BondReportPurchaseRow({ purchase, currency, today }: Props) {
  return (
    <View style={styles.purchase}>
      {/* Badged as the payments' rows after it, in the purchases' color. */}
      <Avatar label={currencySign(currency)} color={SERIES_COLORS.purchase.badge} />
      <View style={styles.details}>
        <View style={styles.title}>
          <Typography variant="callout" tabular>
            {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
          </Typography>
          <Typography variant="callout" weight="semibold" tabular>
            {formatMoney(purchase.amount, currency)}
          </Typography>
        </View>
        <Typography variant="caption1" tone="secondary" tabular>
          по {formatMoney(pricePerBond(purchase.amount, purchase.quantity), currency)} за 1 шт
          {isPlannedPurchase(purchase, today) && ' · заплановано'}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  details: { flex: 1, gap: theme.space.xxs },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
}));
