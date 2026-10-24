import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

type Props = {
  label: string;
  /** Purchases, coupons, redemptions */
  cells: [string, string, string];
  /** `header` names the columns, `total` sums them up */
  kind?: 'header' | 'body' | 'total';
};

/** A row of the year's table: a label, then the purchases, coupons and redemptions. */
export function FlowsTableRow({ label, cells, kind = 'body' }: Props) {
  const tone = kind === 'header' ? 'secondary' : 'primary';
  const weight = kind === 'total' ? 'semibold' : undefined;

  return (
    <View style={styles.row}>
      <Typography variant="caption1" tone={tone} weight={weight} style={styles.label}>
        {label}
      </Typography>
      {cells.map((cell, index) => (
        <Typography
          key={index}
          variant="caption1"
          tone={tone}
          weight={weight}
          tabular
          align="right"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.cell}
        >
          {cell}
        </Typography>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm },
  label: { width: 48 },
  cell: { flex: 1 },
}));
