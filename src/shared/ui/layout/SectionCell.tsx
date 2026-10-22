import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Separator } from './Separator';

export type SectionCellProps = {
  index: number;
  count: number;
  children: ReactNode;
};

/** One row of a section card whose rows are separate list cells. */
export function SectionCell({ index, count, children }: SectionCellProps) {
  return (
    <View
      style={[styles.cell, index === 0 && styles.firstCell, index === count - 1 && styles.lastCell]}
    >
      {index > 0 && <Separator />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  cell: { overflow: 'hidden', borderCurve: 'continuous', backgroundColor: theme.card },
  firstCell: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastCell: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
}));
