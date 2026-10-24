import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import {
  Card,
  type ChartSeries,
  ColumnChart,
  LegendRow,
  SectionTitle,
  Separator,
  Typography,
} from '@/shared/ui';
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
    <View style={styles.section}>
      <SectionTitle title={`Гроші по роках · ${CURRENCY_NAMES[currency]}`} />
      <Card>
        <ColumnChart columns={columns} series={series} currency={currency} />
        <View style={styles.separator}>
          <Separator />
        </View>
        <View style={styles.legend}>
          <LegendRow color="coupon" label="Купони" value={formatMoney(total.coupons, currency)} />
          <LegendRow
            color="redemption"
            label="Погашення"
            value={formatMoney(total.redemptions, currency)}
          />
          <LegendRow
            color="purchase"
            label="Купівлі"
            value={formatMoney(total.invested, currency)}
          />
        </View>
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        Виплати — над лінією, купівлі — під нею; суми в легенді — за всі роки.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  legend: { gap: theme.space.sm },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
