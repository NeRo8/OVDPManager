import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  type Bond,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
  purchaseCurrency,
} from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

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
    <View style={styles.purchase}>
      <View style={styles.purchaseInfo}>
        <Typography variant="callout" tabular>
          {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
        </Typography>
        {isPlannedPurchase(purchase, today) && (
          <Typography variant="caption1" tone="accent">
            Заплановано — виплати після цієї дати
          </Typography>
        )}
        <Typography variant="caption1" tone="secondary">
          {formatMoney(purchase.amount, currency)} · по{' '}
          {formatMoney(pricePerBond(purchase.amount, purchase.quantity), currency)}
        </Typography>
      </View>
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
  purchaseInfo: { flex: 1, gap: theme.space.xxs },
  pressed: { opacity: 0.5 },
}));
