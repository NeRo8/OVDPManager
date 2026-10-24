import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

export type ReportTableRowKind = 'header' | 'body' | 'total';

type Props = {
  label: string;
  /** One per column, right-aligned */
  cells: string[];
  /** `header` names the columns, `total` sums them up or heads a group */
  kind?: ReportTableRowKind;
};

/** A row of a report table: a label, then its numbers in equal columns. */
export function ReportTableRow({ label, cells, kind = 'body' }: Props) {
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
