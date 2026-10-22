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
      <View
        style={[
          styles.clip,
          index === 0 && styles.firstCell,
          index === count - 1 && styles.lastCell,
        ]}
      >
        {index > 0 && <Separator />}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  cell: { borderCurve: 'continuous', backgroundColor: theme.card },
  clip: { borderCurve: 'continuous', overflow: 'hidden' },
  firstCell: { borderTopLeftRadius: theme.radius.md, borderTopRightRadius: theme.radius.md },
  // Only the last cell casts the card shadow, which falls below the group: a shadow on every
  // cell would spill over the cell above it. The clip view repeats the corners without it.
  lastCell: {
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    boxShadow: theme.shadowCard,
  },
}));
