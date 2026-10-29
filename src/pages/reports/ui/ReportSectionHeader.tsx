import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { SectionTitle } from '@/shared/ui';

type Props = {
  /** The blocks before the rows, if any */
  children?: ReactNode;
  /** Names the rows that follow */
  rowsTitle: string;
};

/** What comes before a section's rows in a report list, spaced as the screen's sections. */
export function ReportSectionHeader({ children, rowsTitle }: Props) {
  return (
    <View style={styles.header}>
      {children}
      <SectionTitle title={rowsTitle} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.space.xl, marginTop: theme.space.xl, marginBottom: theme.space.sm },
}));
