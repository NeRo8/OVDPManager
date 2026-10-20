import type { BackupStatus } from '@/features/backup';
import { Typography } from '@/shared/ui';

export function StatusMessage({ status }: { status: BackupStatus | null }) {
  if (!status) return null;
  return (
    <Typography variant="subhead" align="center" tone={status.error ? 'danger' : 'positive'}>
      {status.text}
    </Typography>
  );
}
