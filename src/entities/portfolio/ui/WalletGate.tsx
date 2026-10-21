import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { Button, EmptyState } from '@/shared/ui';
import type { Wallet } from '../model/useWallet.hook';
import { BondsUnavailable } from './BondsStatus';

type Props = {
  wallet: Pick<Wallet, 'holdingsCount' | 'bonds' | 'error' | 'refresh'>;
  children: ReactNode;
};

/**
 * Shows `children` once there is something to show: an empty wallet invites to add a bond, and
 * without the NBU data the screen waits for it or offers a retry.
 */
export function WalletGate({ wallet, children }: Props) {
  if (wallet.holdingsCount === 0) return <EmptyWallet />;
  if (!wallet.bonds) return <BondsUnavailable error={wallet.error} onRetry={wallet.refresh} />;
  return children;
}

function EmptyWallet() {
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
