import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Avatar } from '@/components/avatar/Avatar';
import { ListRow } from '@/components/layout/ListRow';
import { Money } from '@/components/typography/Money';
import { Typography } from '@/components/typography/Typography';
import { bondKindLabel } from '@/lib/portfolio/portfolio';
import type { PositionState, WalletPosition } from '@/lib/portfolio/position';
import { currencyColor } from '@/theme/currency';
import { formatDate } from '@/utils/date';
import { currencySign, formatPercent } from '@/utils/format';

import { ownedLabel } from './ownedLabel';

type Props = {
  item: WalletPosition;
  onPress: () => void;
};

/** Sold or redeemed, or the date it matures. */
function stateLabel(state: PositionState, maturityDate: string): string {
  if (state === 'sold') return 'продано';
  if (state === 'redeemed') return 'погашено';
  return `до ${formatDate(maturityDate)}`;
}

/** A bond of the wallet: its currency's badge, rate and maturity, what it cost and how many. */
export function PositionRow({ item, onPress }: Props) {
  const { position, bond, currency, state, planned } = item;

  const subtitle = bond ? (
    `${bondKindLabel(bond.kind)} · ${currency} · ${formatPercent(bond.rate)} · ${stateLabel(state, bond.maturityDate)}`
  ) : (
    <Typography variant="caption1" tone="warning">
      Немає збережених даних облігації
    </Typography>
  );
  const ownedTone = planned.quantity > 0 ? 'accent' : 'secondary';

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
      subtitle={subtitle}
      trailing={
        <View style={styles.amount}>
          <Typography variant="callout" weight="semibold" tabular align="right">
            <Money value={position.investedAmount} currency={currency} />
          </Typography>
          <Typography variant="caption1" tone={ownedTone} tabular align="right">
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
