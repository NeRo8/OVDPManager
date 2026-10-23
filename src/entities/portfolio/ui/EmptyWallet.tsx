import { router } from 'expo-router';

import { Button, EmptyState } from '@/shared/ui';

export function EmptyWallet() {
  const addBond = () => router.push('/add');
  const openBackupImport = () => router.push('/backup/import');

  return (
    <EmptyState
      title="Гаманець порожній"
      message="Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите графік виплат купонів."
    >
      <Button title="Додати ОВДП" onPress={addBond} />
      <Button title="Відновити з копії" variant="secondary" onPress={openBackupImport} />
    </EmptyState>
  );
}
