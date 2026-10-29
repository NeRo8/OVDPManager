import { Pressable } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import {
  type Bond,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
  purchaseCurrency,
} from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { SERIES_COLORS } from '@/shared/theme';
import { Avatar, ListRow, Typography } from '@/shared/ui';

type Props = {
  purchase: Purchase;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  today: string;
  onDelete: (purchase: Purchase) => void;
};

/** One purchase of a bond in the wallet: when, how many, for how much, with a way to delete it. */
export function PurchaseRow({ purchase, bond, today, onDelete }: Props) {
  const currency = purchaseCurrency(purchase, bond);
  const remove = () => onDelete(purchase);

  return (
    <ListRow
      // Badged as the payments' rows below it, in the purchases' color.
      leading={<Avatar label={currencySign(currency)} color={SERIES_COLORS.purchase.badge} />}
      title={
        <Typography variant="callout" tabular>
          {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
        </Typography>
      }
      trailing={
        <Pressable
          onPress={remove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Видалити купівлю від ${formatDate(purchase.purchaseDate)}`}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Typography variant="subhead" tone="danger">
            Видалити
          </Typography>
        </Pressable>
      }
    >
      {isPlannedPurchase(purchase, today) && (
        <Typography variant="caption1" tone="accent">
          Заплановано — виплати після цієї дати
        </Typography>
      )}
      <Typography variant="caption1" tone="secondary">
        {formatMoney(purchase.amount, currency)} · по{' '}
        {formatMoney(pricePerBond(purchase.amount, purchase.quantity), currency)}
      </Typography>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.5 },
});
