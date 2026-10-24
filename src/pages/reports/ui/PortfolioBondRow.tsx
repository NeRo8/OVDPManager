import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Currency } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { LegendRow, ShareBar, TotalRow, Typography } from '@/shared/ui';
import type { PortfolioBond } from '../model/portfolioReport';
import { bondStateLabel } from './portfolioLabels';
import { shareCell } from './reportCells';

type Props = {
  bond: PortfolioBond;
  currency: Currency;
};

/**
 * One bond of the wallet: where it stands, its rate and yield, what it cost and pays, its net
 * income over the term and its share of what the currency's bonds cost.
 */
export function PortfolioBondRow({ bond: row, currency }: Props) {
  const { isin, bond, state, quantity, invested, results, annualYield, investedShare } = row;
  const money = (value: number) => formatMoney(value, currency);
  const details = [
    bond && `${bond.rate}%`,
    `${quantity} шт`,
    annualYield !== null && `${annualYield}% річних`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.bond}>
      <View style={styles.title}>
        <Typography variant="subhead" weight="semibold" tabular>
          {isin}
        </Typography>
        {state === 'unknown' ? (
          <Typography variant="caption1" tone="warning">
            Немає в даних НБУ
          </Typography>
        ) : (
          <Typography
            variant="caption1"
            tone={state === 'planned' ? 'accent' : 'secondary'}
            tabular
          >
            {bondStateLabel(state, bond?.maturityDate)}
          </Typography>
        )}
      </View>
      <Typography variant="caption1" tone="secondary" tabular>
        {details}
      </Typography>
      <LegendRow color="purchase" label="Вкладено" value={money(invested)} />
      {results && (
        <>
          <LegendRow color="coupon" label="Купони" value={money(results.coupons)} />
          <LegendRow
            color="redemption"
            label="Погашення"
            value={results.complete ? money(results.redemption) : 'Немає повних даних НБУ'}
          />
          <TotalRow
            label="Чистий дохід"
            value={results.netIncome === null ? '—' : money(results.netIncome)}
          />
          {results.received > 0 && results.expected > 0 && (
            <Typography variant="caption1" tone="secondary">
              отримано {money(results.received)}, очікується {money(results.expected)}
            </Typography>
          )}
        </>
      )}
      <View style={styles.share}>
        <ShareBar percent={investedShare} accessibilityLabel="Частка у вкладеннях" />
        <Typography variant="caption1" tone="secondary" tabular>
          {shareCell(investedShare)} вкладень
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
