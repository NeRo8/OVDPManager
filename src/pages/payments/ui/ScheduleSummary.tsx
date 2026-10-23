import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ScheduleEventType } from '@/features/payment-filters';
import type { YearSummary } from '../model/yearSummary';
import { MonthBreakdown } from './MonthBreakdown';
import { YearTotals } from './YearTotals';

/** The year at a glance: money in and out month by month, then the year's totals. */
type Props = {
  summary: YearSummary;
  /** Event types the filters let through; the others leave the chart and the totals */
  types: readonly ScheduleEventType[];
  year: number;
  /** The month spelled out under the chart, January = 0 */
  month: number | null;
  onSelectMonth: (month: number) => void;
};

export function ScheduleSummary({ summary, types, year, month, onSelectMonth }: Props) {
  return (
    <View style={styles.summary}>
      <MonthBreakdown
        summary={summary}
        types={types}
        year={year}
        month={month}
        onSelectMonth={onSelectMonth}
      />
      <YearTotals summary={summary} types={types} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  summary: { gap: theme.space.xl },
}));
