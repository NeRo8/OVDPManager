import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { YearSummary } from '../model/yearSummary';
import { MonthBreakdown } from './MonthBreakdown';
import { YearTotals } from './YearTotals';

/** The year at a glance: money in and out month by month, then the year's totals. */
type Props = {
  summary: YearSummary;
  year: number;
  /** The month spelled out under the chart, January = 0 */
  month: number | null;
  onSelectMonth: (month: number) => void;
};

export function ScheduleSummary({ summary, year, month, onSelectMonth }: Props) {
  return (
    <View style={styles.summary}>
      <MonthBreakdown summary={summary} year={year} month={month} onSelectMonth={onSelectMonth} />
      <YearTotals summary={summary} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  summary: { gap: theme.space.xl },
}));
