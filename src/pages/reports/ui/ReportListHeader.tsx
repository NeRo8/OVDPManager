import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { StaleBondsNotice } from '@/entities/portfolio';

type Props = {
  /** The report's heading; left out while there is nothing to report */
  children?: ReactNode;
};

/** The top of a report list: the stale NBU data notice, then what the report covers. */
export function ReportListHeader({ children }: Props) {
  return (
    <View style={styles.header}>
      <StaleBondsNotice />
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.space.xl },
}));
