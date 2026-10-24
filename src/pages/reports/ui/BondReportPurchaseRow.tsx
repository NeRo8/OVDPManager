import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  type Currency,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
} from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

type Props = {
  purchase: Purchase;
  currency: Currency;
  today: string;
};

/** One purchase of the bond: when, how many and for how much. */
export function BondReportPurchaseRow({ purchase, currency, today }: Props) {
  return (
    <View style={styles.purchase}>
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
  );
}

const styles = StyleSheet.create((theme) => ({
  purchase: {
    gap: theme.space.xxs,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
}));
