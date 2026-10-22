import { router } from 'expo-router';

import { Button, EmptyState } from '@/shared/ui';

export function EmptyWallet() {
  return (
    <EmptyState
      title="Гаманець порожній"
      message="Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите графік виплат купонів."
    >
      <Button title="Додати ОВДП" onPress={() => router.push('/add')} />
      <Button
        title="Відновити з копії"
        variant="secondary"
        onPress={() => router.push('/backup/import')}
      />
    </EmptyState>
  );
}
