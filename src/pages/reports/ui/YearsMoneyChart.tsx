import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney, round2 } from '@/shared/lib';
import { Card, type ChartSeries, ColumnChart, LegendRow, Separator } from '@/shared/ui';

import { purchaseValues } from '../model/purchaseValues';
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
  const { made, planned } = purchaseValues(years);
  const series: ChartSeries[] = [
    { label: 'купони', color: 'coupon', values: years.map((year) => year.coupons) },
    { label: 'погашення', color: 'redemption', values: years.map((year) => year.redemptions) },
    { label: 'купівлі', color: 'purchase', values: made, direction: 'down' },
    ...(total.planned > 0
      ? [
          {
            label: 'заплановані купівлі',
            color: 'plannedPurchase' as const,
            values: planned,
            direction: 'down' as const,
          },
        ]
      : []),
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
        <LegendRow
          color="purchase"
          label="Купівлі"
          value={formatMoney(round2(total.invested - total.planned), currency)}
        />
        {total.planned > 0 && (
          <LegendRow
            color="plannedPurchase"
            label="Заплановані купівлі"
            value={formatMoney(total.planned, currency)}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Cancels the separator's own inset, so the line runs the card's full width.
  legend: { gap: theme.space.sm },
}));
