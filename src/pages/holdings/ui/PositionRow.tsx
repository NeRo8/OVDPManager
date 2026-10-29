import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import type { WalletPosition } from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { currencyColor } from '@/shared/theme';
import { Avatar, ListRow, Typography } from '@/shared/ui';

type Props = {
  item: WalletPosition;
  onPress: () => void;
};

/** A bond of the wallet: its currency's badge, rate and maturity, what it cost and how many. */
export function PositionRow({ item: { position, bond, currency, state }, onPress }: Props) {
  // Nothing bought yet: every purchase of the position is still ahead.
  const isPlanned = state === 'planned';

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
            tone={isPlanned ? 'accent' : 'secondary'}
            tabular
            align="right"
          >
            {position.quantity} шт{isPlanned && ' · заплановано'}
          </Typography>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  amount: { flexShrink: 0, gap: theme.space.xxs },
}));
