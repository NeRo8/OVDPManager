import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney, plural } from '@/shared/lib';
import { Card, LegendRow, Separator, TotalRow } from '@/shared/ui';

import type { CurrencyReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';

type Props = {
  report: CurrencyReport;
  terms: ReportTerms;
};

/** The year's or the period's sums in one currency, and what its coupons came to a month. */
export function PeriodSummary({ report, terms }: Props) {
  const { currency, invested, coupons, redemptions, averageMonthlyCoupons, months } = report;
  const monthCount = months.length;

  return (
    <Card
      title={`Підсумок · ${CURRENCY_NAMES[currency]}`}
      footer={`Купони ${terms.span}, поділені на ${monthCount} ${plural(monthCount, 'місяць', 'місяці', 'місяців')}. Погашення повертає номінал, а не приносить нові гроші щомісяця, тож у середнє не входить.`}
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
