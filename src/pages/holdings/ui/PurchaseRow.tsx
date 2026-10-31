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
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
};

/**
 * One purchase of a bond in the wallet: when, how many, for how much. A tap opens it to confirm or
 * correct; the button deletes it.
 */
export function PurchaseRow({ purchase, bond, today, onEdit, onDelete }: Props) {
  const currency = purchaseCurrency(purchase, bond);
  const isPlanned = isPlannedPurchase(purchase, today);
  const edit = () => onEdit(purchase);
  const remove = () => onDelete(purchase);

  return (
    <ListRow
      onPress={edit}
      accessibilityRole="button"
      accessibilityLabel={`${isPlanned ? 'Підтвердити' : 'Змінити'} купівлю від ${formatDate(purchase.purchaseDate)}`}
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
      {isPlanned && (
        <Typography variant="caption1" tone="accent">
          Заплановано — торкніться, щоб підтвердити справжньою сумою
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
