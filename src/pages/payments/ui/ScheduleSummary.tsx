import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ScheduleProps } from './schedule.types';
import { MonthBreakdown } from './MonthBreakdown';
import { YearTotals } from './YearTotals';

/** The year at a glance: money in and out month by month, then the year's totals. */
export function ScheduleSummary({ schedule }: ScheduleProps) {
  return (
    <View style={styles.summary}>
      <MonthBreakdown schedule={schedule} />
      <YearTotals schedule={schedule} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  summary: { gap: theme.space.xl },
}));
