import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Currency } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { LegendRow, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { BondReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';
import { shareCell } from './reportCells';

type Props = {
  bond: BondReport;
  currency: Currency;
  terms: ReportTerms;
};

/**
 * What one bond paid, cost and earned in the report, with its yield and its share of the report's
 * income; of the payments and purchases only the sums it had are listed.
 */
export function ReportBondRow({ bond, currency, terms }: Props) {
  return (
    <View style={styles.bond}>
      <View style={styles.title}>
        <Typography variant="subhead" weight="semibold" tabular>
          {bond.isin}
        </Typography>
        {bond.annualYield !== null && (
          <Typography variant="caption1" tone="secondary" tabular>
            {bond.annualYield}% річних
          </Typography>
        )}
      </View>
      {bond.coupons > 0 && (
        <LegendRow color="coupon" label="Купони" value={formatMoney(bond.coupons, currency)} />
      )}
      {bond.redemptions > 0 && (
        <LegendRow
          color="redemption"
          label="Погашення"
          value={formatMoney(bond.redemptions, currency)}
        />
      )}
      {bond.invested > 0 && (
        <LegendRow color="purchase" label="Купівлі" value={formatMoney(bond.invested, currency)} />
      )}
      <TotalRow
        label={terms.income}
        value={formatMoney(bond.income, currency)}
        signedValue={bond.income}
      />
      {bond.incomeShare !== null && (
        <View style={styles.share}>
          <ShareBar
            percent={Math.min(bond.incomeShare, 100)}
            accessibilityLabel={`Частка в доході ${terms.span}`}
          />
          <Typography variant="caption1" tone="secondary" tabular>
            {shareCell(bond.incomeShare)} доходу {terms.span}
          </Typography>
        </View>
      )}
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
