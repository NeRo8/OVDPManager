import { formatDate } from '@/shared/lib';
import { Typography } from '@/shared/ui';

type Props = {
  planName?: string;
  /** The day the report is made, YYYY-MM-DD */
  date: string;
};

/** What a report covers and when it was made, under the report. */
export function ReportCaption({ planName, date }: Props) {
  return (
    <Typography variant="caption2" tone="secondary" align="center">
      План «{planName}» · сформовано {formatDate(date)}
    </Typography>
  );
}
