import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { Card, LegendRow, SectionTitle, Separator, TotalRow, Typography } from '@/shared/ui';
import type { CurrencyYear } from '../model/yearReport';

type Props = {
  report: CurrencyYear;
};

/** The year's sums in one currency: payments, purchases, and what the year came to. */
export function YearSummary({ report }: Props) {
  const { currency, coupons, redemptions, totalPayments, received, expected, invested } = report;
  const { balance, income } = report;

  return (
    <View style={styles.section}>
      <SectionTitle title={`Підсумок · ${CURRENCY_NAMES[currency]}`} />
      <Card>
        <View style={styles.rows}>
          <LegendRow color="coupon" label="Купони" value={formatMoney(coupons, currency)} />
          <LegendRow
            color="redemption"
            label="Погашення"
            value={formatMoney(redemptions, currency)}
          />
          <TotalRow label="Усього виплат" value={formatMoney(totalPayments, currency)} />
          {expected > 0 && (
            <Typography variant="caption1" tone="secondary">
              отримано {formatMoney(received, currency)}, очікується{' '}
              {formatMoney(expected, currency)}
            </Typography>
          )}
        </View>
        <View style={styles.separator}>
          <Separator />
        </View>
        <LegendRow color="purchase" label="Купівлі" value={formatMoney(invested, currency)} />
        <View style={styles.separator}>
          <Separator />
        </View>
        <View style={styles.rows}>
          <TotalRow label="Сальдо року" value={formatMoney(balance, currency)} />
          <TotalRow label="Дохід за рік" value={formatMoney(income, currency)} />
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        Сальдо року — виплати мінус купівлі. Дохід за рік — купони та різниця між погашенням і ціною
        купівлі погашених ОВДП.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  rows: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
