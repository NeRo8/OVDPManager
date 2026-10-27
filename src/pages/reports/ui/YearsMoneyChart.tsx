import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { Card, type ChartSeries, ColumnChart, LegendRow, Separator } from '@/shared/ui';
import type { CurrencyYears } from '../model/yearOverYearReport';
import { yearColumns } from './yearColumns';

type Props = {
  report: CurrencyYears;
};

/**
 * Each year's payments above the baseline and purchases below it, in one currency; the legend
 * sums each up over all the years.
 */
export function YearsMoneyChart({ report }: Props) {
  const { currency, years, total } = report;
  const columns = yearColumns(years.map(({ year }) => year));
  const series: ChartSeries[] = [
    { label: 'купони', color: 'coupon', values: years.map((year) => year.coupons) },
    { label: 'погашення', color: 'redemption', values: years.map((year) => year.redemptions) },
    {
      label: 'купівлі',
      color: 'purchase',
      values: years.map((year) => year.invested),
      direction: 'down',
    },
  ];

  return (
    <Card
      title={`Гроші по роках · ${CURRENCY_NAMES[currency]}`}
      footer="Виплати — над лінією, купівлі — під нею; суми в легенді — за всі роки."
    >
      <ColumnChart columns={columns} series={series} currency={currency} />
      <Separator variant="card" />
      <View style={styles.legend}>
        <LegendRow color="coupon" label="Купони" value={formatMoney(total.coupons, currency)} />
        <LegendRow
          color="redemption"
          label="Погашення"
          value={formatMoney(total.redemptions, currency)}
        />
        <LegendRow color="purchase" label="Купівлі" value={formatMoney(total.invested, currency)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Cancels the separator's own inset, so the line runs the card's full width.
  legend: { gap: theme.space.sm },
}));
