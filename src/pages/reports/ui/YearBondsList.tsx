import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { LegendRow, Section, Separator, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { CurrencyYear } from '../model/yearReport';

type Props = {
  report: CurrencyYear;
};

/** Whole percent; a share that rounds to zero still shows it is there. */
const formatShare = (share: number) => (share < 0.5 ? '<1%' : `${Math.round(share)}%`);

/**
 * What each bond paid, cost and earned in the year, in one currency, with its yield and its share
 * of the year's income; of the payments and purchases only the sums it had are listed.
 */
export function YearBondsList({ report }: Props) {
  const { currency, bonds } = report;

  return (
    <Section title={`По облігаціях · ${CURRENCY_NAMES[currency]}`}>
      {bonds.map((bond, index) => (
        <Fragment key={bond.isin}>
          {index > 0 && <Separator />}
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
              <LegendRow
                color="coupon"
                label="Купони"
                value={formatMoney(bond.coupons, currency)}
              />
            )}
            {bond.redemptions > 0 && (
              <LegendRow
                color="redemption"
                label="Погашення"
                value={formatMoney(bond.redemptions, currency)}
              />
            )}
            {bond.invested > 0 && (
              <LegendRow
                color="purchase"
                label="Купівлі"
                value={formatMoney(bond.invested, currency)}
              />
            )}
            <TotalRow label="Дохід за рік" value={formatMoney(bond.income, currency)} />
            {bond.incomeShare !== null && (
              <View style={styles.share}>
                <ShareBar
                  percent={Math.min(bond.incomeShare, 100)}
                  accessibilityLabel="Частка в доході року"
                />
                <Typography variant="caption1" tone="secondary" tabular>
                  {formatShare(bond.incomeShare)} доходу року
                </Typography>
              </View>
            )}
          </View>
        </Fragment>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  share: { gap: theme.space.xs, marginTop: theme.space.xxs },
  bond: {
    gap: theme.space.xs,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
}));
