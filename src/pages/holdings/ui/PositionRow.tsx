import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import type { WalletPosition } from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { currencyColor } from '@/shared/theme';
import { Avatar, ListRow, Typography } from '@/shared/ui';

import { ownedLabel } from './ownedLabel';

type Props = {
  item: WalletPosition;
  onPress: () => void;
};

/** A bond of the wallet: its currency's badge, rate and maturity, what it cost and how many. */
export function PositionRow({ item, onPress }: Props) {
  const { position, bond, currency, state, planned } = item;

  return (
    <ListRow
      onPress={onPress}
      accessibilityRole="link"
      // Each currency in its own color, so mixed holdings sort out at a glance.
      leading={<Avatar label={currencySign(currency)} color={currencyColor(currency)} />}
      title={
        <Typography variant="headline" tabular>
          {position.isin}
        </Typography>
      }
      subtitle={
        bond ? (
          `${bond.rate}% · ${state === 'redeemed' ? 'погашено' : `до ${formatDate(bond.maturityDate)}`}`
        ) : (
          <Typography variant="caption1" tone="warning">
            Немає в даних НБУ
          </Typography>
        )
      }
      trailing={
        <View style={styles.amount}>
          <Typography variant="callout" weight="semibold" tabular align="right">
            {formatMoney(position.investedAmount, currency)}
          </Typography>
          <Typography
            variant="caption1"
            tone={planned.quantity > 0 ? 'accent' : 'secondary'}
            tabular
            align="right"
          >
            {ownedLabel(position.quantity, planned.quantity)}
          </Typography>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  amount: { flexShrink: 0, gap: theme.space.xxs },
}));
