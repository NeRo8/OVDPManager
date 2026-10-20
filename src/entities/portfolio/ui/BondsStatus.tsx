import { StyleSheet } from 'react-native';

import { Button, EmptyState, Typography } from '@/shared/ui';

/** Full screen while the NBU bond list is loading or could not be loaded at all. */
export function BondsUnavailable({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  if (!error) return <EmptyState loading message="Завантажуємо дані НБУ…" />;
  return (
    <EmptyState title="Немає зв’язку з НБУ" message={error}>
      <Button title="Спробувати ще раз" onPress={onRetry} />
    </EmptyState>
  );
}

/** Inline notice when a refresh failed but cached bonds are still shown. */
export function StaleBondsNotice({ error }: { error: string | null }) {
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
