import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Card, SectionTitle, Separator, Typography } from '@/shared/ui';
import { ReportTableRow, type ReportTableRowKind } from './ReportTableRow';

export type ReportTableLine = {
  key: string;
  label: string;
  cells: string[];
  signedCells?: (number | null)[];
  kind?: ReportTableRowKind;
};

type Props = {
  title: string;
  columns: string[];
  rows: ReportTableLine[];
  /** The last row, under a line */
  total: Pick<ReportTableLine, 'label' | 'cells' | 'signedCells'>;
  footer?: string;
};

/** A table in a card, as a report shows it so that it reads the same on paper. */
export function ReportTable({ title, columns, rows, total, footer }: Props) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      <Card>
        <ReportTableRow label="" cells={columns} kind="header" />
        {rows.map(({ key, ...row }) => (
          <ReportTableRow key={key} {...row} />
        ))}
        <View style={styles.separator}>
          <Separator />
        </View>
        <ReportTableRow
          label={total.label}
          cells={total.cells}
          signedCells={total.signedCells}
          kind="total"
        />
      </Card>
      {footer && (
        <Typography variant="caption1" tone="secondary" style={styles.footer}>
          {footer}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  // Cancels the separator's own inset, so the line runs the card's full width.
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.xs },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
