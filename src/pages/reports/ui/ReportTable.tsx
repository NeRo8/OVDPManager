import { Card, Separator } from '@/shared/ui';
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
    <Card title={title} footer={footer}>
      <ReportTableRow label="" cells={columns} kind="header" />
      {rows.map(({ key, ...row }) => (
        <ReportTableRow key={key} {...row} />
      ))}
      <Separator variant="table" />
      <ReportTableRow
        label={total.label}
        cells={total.cells}
        signedCells={total.signedCells}
        kind="total"
      />
    </Card>
  );
}
