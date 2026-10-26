import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { Card, LegendRow, SectionTitle, Separator, TotalRow, Typography } from '@/shared/ui';
import type { CurrencyReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';

type Props = {
  report: CurrencyReport;
  terms: ReportTerms;
};

/** The report's sums in one currency: payments, purchases, and what they came to. */
export function ReportSummary({ report, terms }: Props) {
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
          <TotalRow
            label={terms.balance}
            value={formatMoney(balance, currency)}
            signedValue={balance}
          />
          <TotalRow
            label={terms.income}
            value={formatMoney(income, currency)}
            signedValue={income}
          />
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        {terms.balance} — виплати мінус купівлі. {terms.income} — купони та різниця між погашенням і
        ціною купівлі погашених ОВДП.
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
