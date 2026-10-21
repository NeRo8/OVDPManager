import type { BackupStatus } from '@/features/backup';
import { Typography } from '@/shared/ui';

type Props = {
  status: BackupStatus | null;
};

export function StatusMessage({ status }: Props) {
  if (!status) return null;
  return (
    <Typography variant="subhead" align="center" tone={status.error ? 'danger' : 'positive'}>
      {status.text}
    </Typography>
  );
}
