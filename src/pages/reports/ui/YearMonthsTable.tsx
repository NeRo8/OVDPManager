import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { MONTHS_SHORT, currencySign, formatAmount } from '@/shared/lib';
import { Card, SectionTitle, Separator } from '@/shared/ui';
import type { CurrencyYear, YearFlows } from '../model/yearReport';
import { FlowsTableRow } from './FlowsTableRow';

type Props = {
  report: CurrencyYear;
};

const cell = (value: number) => (value ? formatAmount(value) : '—');
const cells = ({ invested, coupons, redemptions }: YearFlows): [string, string, string] => [
  cell(invested),
  cell(coupons),
  cell(redemptions),
];

/** Every month of the year in one currency, as a table that reads the same on paper. */
export function YearMonthsTable({ report }: Props) {
  return (
    <View style={styles.section}>
      <SectionTitle
        title={`По місяцях · ${CURRENCY_NAMES[report.currency]}, ${currencySign(report.currency)}`}
      />
      <Card>
        <FlowsTableRow label="" cells={['Купівлі', 'Купони', 'Погашення']} kind="header" />
        {report.months.map((month, index) => (
          <FlowsTableRow key={index} label={MONTHS_SHORT[index]} cells={cells(month)} />
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
