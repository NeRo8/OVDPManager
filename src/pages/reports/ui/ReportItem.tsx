import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

type Props = {
  /** Names the row, such as the bond's ISIN */
  title: string;
  /** On the title's line, at the right: the row's main figure */
  aside?: ReactNode;
  /** What follows the title: details, legend rows, a share bar */
  children: ReactNode;
};

/** A row of a report list that reads top to bottom: its title and figure, then its details. */
export function ReportItem({ title, aside, children }: Props) {
  return (
    <View style={styles.item}>
      <View style={styles.title}>
        <Typography variant="subhead" weight="semibold" tabular>
          {title}
        </Typography>
        {aside}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  item: {
    gap: theme.space.xs,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
}));
