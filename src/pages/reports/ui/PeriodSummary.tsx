import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { Card, LegendRow, Separator, TotalRow } from '@/shared/ui';

import type { CurrencyReport } from '../model/periodReport';
import { type ReportTerms, summaryFooter } from '../model/reportTerms';

type Props = {
  report: CurrencyReport;
  terms: ReportTerms;
};

/**
 * The year's or the period's sums in one currency: what went out and came in, what that came to
 * («Сальдо» and «Дохід») and what its coupons came to a month.
 */
export function PeriodSummary({ report, terms }: Props) {
  const { currency, invested, coupons, redemptions, balance, income } = report;
  const { averageMonthlyCoupons, monthCount } = report;

  return (
    <Card
      title={`Підсумок · ${CURRENCY_NAMES[currency]}`}
      footer={summaryFooter(terms, monthCount)}
    >
      <View style={styles.rows}>
        <LegendRow color="purchase" label="Вкладено" value={formatMoney(invested, currency)} />
        <LegendRow color="coupon" label="Купони" value={formatMoney(coupons, currency)} />
        <LegendRow
          color="redemption"
          label="Погашення"
          value={formatMoney(redemptions, currency)}
        />
      </View>
      <Separator variant="card" />
      <View style={styles.rows}>
        <TotalRow
          label={terms.balance}
          value={formatMoney(balance, currency)}
          signedValue={balance}
        />
        <TotalRow label={terms.income} value={formatMoney(income, currency)} signedValue={income} />
      </View>
      <Separator variant="card" />
      <TotalRow
        label="Купони в середньому за місяць"
        value={formatMoney(averageMonthlyCoupons, currency)}
      />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  rows: { gap: theme.space.sm },
}));
