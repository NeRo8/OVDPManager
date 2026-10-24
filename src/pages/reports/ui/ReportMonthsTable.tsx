import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { MONTHS_SHORT, currencySign, formatAmount } from '@/shared/lib';
import { Card, SectionTitle, Separator } from '@/shared/ui';
import type { CurrencyReport, Flows } from '../model/periodReport';
import { FlowsTableRow } from './FlowsTableRow';

type Props = {
  report: CurrencyReport;
};

const cell = (value: number) => (value ? formatAmount(value) : '—');
const cells = ({ invested, coupons, redemptions }: Flows): [string, string, string] => [
  cell(invested),
  cell(coupons),
  cell(redemptions),
];
const yearOf = (month: string) => month.slice(0, 4);
const monthName = (month: string) => MONTHS_SHORT[Number(month.slice(5, 7)) - 1];

/**
 * Every month of the report in one currency, as a table that reads the same on paper. When the
 * months span several years, each year's months follow a row with the year.
 */
export function ReportMonthsTable({ report }: Props) {
  const { months } = report;
  const severalYears = yearOf(months[0].month) !== yearOf(months.at(-1)?.month ?? '');

  return (
    <View style={styles.section}>
      <SectionTitle
        title={`По місяцях · ${CURRENCY_NAMES[report.currency]}, ${currencySign(report.currency)}`}
      />
      <Card>
        <FlowsTableRow label="" cells={['Купівлі', 'Купони', 'Погашення']} kind="header" />
        {months.map((month, index) => (
          <Fragment key={month.month}>
            {severalYears && yearOf(month.month) !== yearOf(months[index - 1]?.month ?? '') && (
              <FlowsTableRow label={yearOf(month.month)} cells={['', '', '']} kind="total" />
            )}
            <FlowsTableRow label={monthName(month.month)} cells={cells(month)} />
          </Fragment>
        ))}
        <View style={styles.separator}>
          <Separator />
        </View>
        <FlowsTableRow label="Разом" cells={cells(report)} kind="total" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.xs },
}));
