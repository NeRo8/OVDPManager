import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Currency } from '@/entities/portfolio';
import { formatDate, formatMoney, formatTimeLeft } from '@/shared/lib';
import { ShareBar, Typography } from '@/shared/ui';
import type { StructureBond } from '../model/structureReport';
import { shareCell } from './reportCells';

type Props = {
  bond: StructureBond;
  currency: Currency;
  today: string;
};

/** One bond's part of its currency's money, with its rate and time left to maturity. */
export function StructureBondRow({ bond: row, currency, today }: Props) {
  const { isin, bond, amount, share } = row;

  return (
    <View style={styles.bond}>
      <View style={styles.title}>
        <Typography variant="subhead" weight="semibold" tabular>
          {isin}
        </Typography>
        <Typography variant="subhead" weight="semibold" tabular>
          {formatMoney(amount, currency)}
        </Typography>
      </View>
      <Typography variant="caption1" tone="secondary" tabular>
        {bond.rate}% · до {formatDate(bond.maturityDate)} ·{' '}
        {formatTimeLeft(today, bond.maturityDate)}
      </Typography>
      <View style={styles.share}>
        <ShareBar percent={share} accessibilityLabel={`Частка ${isin}`} />
        <Typography variant="caption1" tone="secondary" tabular>
          {shareCell(share)} грошей у валюті
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bond: {
    gap: theme.space.xs,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  share: { gap: theme.space.xs, marginTop: theme.space.xxs },
}));
