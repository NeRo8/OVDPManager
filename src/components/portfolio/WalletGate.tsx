import type { ReactNode } from 'react';

import { useActivePurchases } from '@/stores/activePlan';

import { BondsGate } from './BondsGate';
import { EmptyWallet } from './EmptyWallet';

type Props = {
  children: ReactNode;
  allowMissingBonds?: boolean;
};

/**
 * Shows `children` once there is something to show: an empty wallet invites to add a bond, and
 * without the NBU data the screen waits for it or offers a retry.
 */
export function WalletGate({ children, allowMissingBonds = false }: Props) {
  const { purchases } = useActivePurchases();
  if (purchases.length === 0) return <EmptyWallet />;
  return allowMissingBonds ? children : <BondsGate>{children}</BondsGate>;
}
