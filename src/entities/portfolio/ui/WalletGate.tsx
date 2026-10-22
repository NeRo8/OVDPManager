import type { ReactNode } from 'react';

import type { Wallet } from '../model/useWallet.hook';
import { BondsUnavailable } from './BondsUnavailable';
import { EmptyWallet } from './EmptyWallet';

type Props = {
  wallet: Pick<Wallet, 'numberOfPurchases' | 'bonds' | 'error' | 'refresh'>;
  children: ReactNode;
};

/**
 * Shows `children` once there is something to show: an empty wallet invites to add a bond, and
 * without the NBU data the screen waits for it or offers a retry.
 */
export function WalletGate({ wallet, children }: Props) {
  if (wallet.numberOfPurchases === 0) return <EmptyWallet />;
  if (!wallet.bonds) return <BondsUnavailable error={wallet.error} onRetry={wallet.refresh} />;
  return children;
}
