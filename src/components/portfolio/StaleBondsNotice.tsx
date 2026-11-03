import { Typography } from '@/components/typography/Typography';
import { useBonds } from '@/hooks/useBonds.hook';
import { useActiveOperations } from '@/stores/plans';
import { formatDateTime } from '@/utils/date';

/** Inline notice when a refresh failed but saved NBU data is still shown. */
export function StaleBondsNotice() {
  const { bonds, error, updatedAt } = useBonds();
  const { operations } = useActiveOperations();
  if (!error || (!bonds && !operations.some((operation) => operation.ovdp))) return null;
  return (
    <Typography variant="caption1" tone="warning" align="center">
      Не вдалося оновити дані НБУ — показано збережені
      {updatedAt ? ` від ${formatDateTime(new Date(updatedAt).toISOString())}` : ''}.
    </Typography>
  );
}
