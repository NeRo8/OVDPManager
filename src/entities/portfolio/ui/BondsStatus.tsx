import { StyleSheet } from 'react-native-unistyles';

import { Button, EmptyState, LoadingState, Typography } from '@/shared/ui';

export type BondsUnavailableProps = {
  error: string | null;
  onRetry: () => void;
};

/** Full screen while the NBU bond list is loading or could not be loaded at all. */
export function BondsUnavailable({ error, onRetry }: BondsUnavailableProps) {
  if (!error) return <LoadingState message="Завантажуємо дані НБУ…" />;
  return (
    <EmptyState title="Немає зв’язку з НБУ" message={error}>
      <Button title="Спробувати ще раз" onPress={onRetry} />
    </EmptyState>
  );
}

export type StaleBondsNoticeProps = {
  error: string | null;
};

/** Inline notice when a refresh failed but cached bonds are still shown. */
export function StaleBondsNotice({ error }: StaleBondsNoticeProps) {
  if (!error) return null;
  return (
    <Typography variant="caption1" tone="danger" align="center">
      Не вдалося оновити дані НБУ — показано збережені.
    </Typography>
  );
}

/** Footer of pull-to-refresh lists built on NBU data. */
export function NbuSourceNote() {
  return (
    <Typography variant="caption2" tone="secondary" align="center" style={styles.source}>
      Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
    </Typography>
  );
}

const styles = StyleSheet.create({
  source: { marginTop: 24 },
});
