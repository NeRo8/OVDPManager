import { router } from 'expo-router';

import { Button } from '@/components/button/Button';
import { EmptyState } from '@/components/layout/EmptyState';

export function EmptyWallet() {
  const addBond = () => router.push('/add');
  const openBackupImport = () => router.push('/backup/import');

  return (
    <EmptyState
      icon="wallet-outline"
      title="Гаманець порожній"
      message="Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите виплати купонів."
    >
      <Button title="Додати ОВДП" onPress={addBond} />
      <Button title="Відновити з копії" variant="secondary" onPress={openBackupImport} />
    </EmptyState>
  );
}
