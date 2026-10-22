import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ScheduleProps } from './schedule.types';
import { MonthBreakdown } from './MonthBreakdown';
import { YearTotals } from './YearTotals';

/** The year at a glance: money in and money out, then the same split month by month. */
export function ScheduleSummary({ schedule }: ScheduleProps) {
  return (
    <View style={styles.summary}>
      <YearTotals schedule={schedule} />
      <MonthBreakdown schedule={schedule} />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 24 },
});
