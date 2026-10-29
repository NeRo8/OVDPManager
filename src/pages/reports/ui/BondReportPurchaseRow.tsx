import { StyleSheet } from 'react-native-unistyles';

import {
  type Currency,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
} from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { SERIES_COLORS } from '@/shared/theme';
import { Avatar, ListRow, Typography } from '@/shared/ui';

type Props = {
  purchase: Purchase;
  currency: Currency;
  today: string;
};

/** One purchase of the bond: when, how many and for how much. */
export function BondReportPurchaseRow({ purchase, currency, today }: Props) {
  return (
    <ListRow
      // Badged as the payments' rows after it, in the purchases' color.
      leading={<Avatar label={currencySign(currency)} color={SERIES_COLORS.purchase.badge} />}
      title={
        <Typography variant="callout" tabular>
          {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
        </Typography>
      }
      subtitle={
        <Typography variant="caption1" tone="secondary" tabular>
          по {formatMoney(pricePerBond(purchase.amount, purchase.quantity), currency)} за 1 шт
          {isPlannedPurchase(purchase, today) && ' · заплановано'}
        </Typography>
      }
      trailing={
        <Typography variant="callout" weight="semibold" tabular style={styles.amount}>
          {formatMoney(purchase.amount, currency)}
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  amount: { flexShrink: 0 },
});
