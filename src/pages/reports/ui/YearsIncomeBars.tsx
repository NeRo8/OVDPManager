import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import { Card, ShareBar, SignedValue, Typography } from '@/shared/ui';

import type { CurrencyYears } from '../model/yearOverYearReport';

type Props = {
  report: CurrencyYears;
};

/** Each year's income in one currency, as a bar against the largest one, its sum written beside. */
export function YearsIncomeBars({ report }: Props) {
  const { currency, years } = report;
  const largest = Math.max(...years.map((year) => year.income));

  return (
    <Card title={`Дохід по роках · ${CURRENCY_NAMES[currency]}`}>
      <View style={styles.years}>
        {years.map(({ year, income }) => (
          <View key={year} style={styles.year}>
            <View style={styles.row}>
              <Typography variant="footnote" tone="secondary" tabular>
                {year}
              </Typography>
              <SignedValue value={income} variant="footnote" weight="semibold" tabular>
                {formatMoney(income, currency)}
              </SignedValue>
            </View>
            <ShareBar
              percent={largest > 0 && income > 0 ? (income / largest) * 100 : 0}
              accessibilityLabel={`Дохід за ${year} рік`}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  years: { gap: theme.space.md },
  year: { gap: theme.space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md },
}));
