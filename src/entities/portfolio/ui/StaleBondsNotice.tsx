import { Typography } from '@/shared/ui';

export type StaleBondsNoticeProps = {
  error: string | null;
};

/** Inline notice when a refresh failed but cached bonds are still shown. */
export function StaleBondsNotice({ error }: StaleBondsNoticeProps) {
  if (!error) return null;
  return (
    <Typography variant="caption1" tone="warning" align="center">
      Не вдалося оновити дані НБУ — показано збережені.
    </Typography>
  );
}
