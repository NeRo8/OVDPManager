import { Typography } from '@/shared/ui';
import { useBonds } from '../api/useBonds.hook';

/** Inline notice when a refresh failed but saved NBU data is still shown. */
export function StaleBondsNotice() {
  const { bonds, error } = useBonds();
  if (!error || !bonds) return null;
  return (
    <Typography variant="caption1" tone="warning" align="center">
      Не вдалося оновити дані НБУ — показано збережені.
    </Typography>
  );
}
