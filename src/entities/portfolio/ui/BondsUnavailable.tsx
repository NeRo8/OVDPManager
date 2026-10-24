import { Button, EmptyState, LoadingState } from '@/shared/ui';

export type BondsUnavailableProps = {
  error: string | null;
  onRetry: () => void;
};

/** Full screen while the NBU bond list is loading or could not be loaded at all. */
export function BondsUnavailable({ error, onRetry }: BondsUnavailableProps) {
  if (!error) return <LoadingState message="Завантажуємо дані НБУ…" />;
  return (
    <EmptyState icon="cloud-offline-outline" title="Немає зв’язку з НБУ" message={error}>
      <Button title="Спробувати ще раз" onPress={onRetry} />
    </EmptyState>
  );
}
