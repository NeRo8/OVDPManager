import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { YearNav, type YearNavProps } from '@/shared/ui';

/** Tab header of the schedule: the year switcher takes the place of the title. */
export function ScheduleHeader(props: YearNavProps) {
  return (
    <View style={styles.header}>
      <View style={styles.bar}>
        <YearNav {...props} />
      </View>
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  header: { paddingTop: rt.insets.top, backgroundColor: theme.card },
  bar: { minHeight: 44, paddingVertical: 4, justifyContent: 'center' },
  border: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
}));
