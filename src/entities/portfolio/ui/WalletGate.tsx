import type { ReactNode } from 'react';

import { useActivePurchases } from '../model/useWallet.hook';

import { BondsGate } from './BondsGate';
import { EmptyWallet } from './EmptyWallet';

type Props = {
  children: ReactNode;
};

/**
 * Shows `children` once there is something to show: an empty wallet invites to add a bond, and
 * without the NBU data the screen waits for it or offers a retry.
 */
export function WalletGate({ children }: Props) {
  const { purchases } = useActivePurchases();
  if (purchases.length === 0) return <EmptyWallet />;
  return <BondsGate>{children}</BondsGate>;
}
