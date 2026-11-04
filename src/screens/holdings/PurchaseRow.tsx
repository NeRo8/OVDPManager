import { Pressable } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Avatar } from '@/components/avatar/Avatar';
import { ListRow } from '@/components/layout/ListRow';
import { Money } from '@/components/typography/Money';
import { Typography } from '@/components/typography/Typography';
import {
  type Bond,
  type Operation,
  isPlannedPurchase,
  pricePerBond,
  purchaseCurrency,
} from '@/lib/portfolio/portfolio';
import { SERIES_COLORS } from '@/theme/series';
import { formatDate } from '@/utils/date';
import { currencySign } from '@/utils/format';

type Props = {
  purchase: Operation;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  today: string;
  onEdit: (purchase: Operation) => void;
  onDelete: (purchase: Operation) => void;
};

/**
 * One purchase of a bond in the wallet: when, how many, for how much. A tap opens it to confirm or
 * correct; the button deletes it.
 */
export function PurchaseRow({ purchase, bond, today, onEdit, onDelete }: Props) {
  const kind = purchase.type === 'sale' ? 'Продаж' : 'Купівля';
  const currency = purchaseCurrency(purchase, bond);
  const isPlanned = isPlannedPurchase(purchase, today);
  const price = pricePerBond(purchase.amount, purchase.quantity);
  const edit = () => onEdit(purchase);
  const remove = () => onDelete(purchase);

  return (
    <ListRow
      onPress={bond ? edit : undefined}
      accessibilityRole={bond ? 'button' : undefined}
      accessibilityLabel={bond ? `Змінити операцію від ${formatDate(purchase.date)}` : undefined}
      // Badged as the payments' rows, in the color of its operation's series.
      leading={<Avatar label={currencySign(currency)} color={SERIES_COLORS[purchase.type].badge} />}
      title={
        <Typography variant="callout" tabular>
          {kind} · {formatDate(purchase.date)} · {purchase.quantity} шт
        </Typography>
      }
      trailing={
        <Pressable
          onPress={remove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Видалити операцію від ${formatDate(purchase.date)}`}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Typography variant="subhead" tone="danger">
            Видалити
          </Typography>
        </Pressable>
      }
    >
      {isPlanned && bond && (
        <Typography variant="caption1" tone="accent">
          Заплановано — торкніться, щоб змінити
        </Typography>
      )}
      {!bond && (
        <Typography variant="caption1" tone="secondary">
          Редагування недоступне без збережених умов ОВДП
        </Typography>
      )}
      <Typography variant="caption1" tone="secondary">
        <Money value={purchase.amount} currency={currency} /> · по{' '}
        <Money value={price} currency={currency} />
      </Typography>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.5 },
});
