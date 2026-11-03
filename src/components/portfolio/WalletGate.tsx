import type { ReactNode } from 'react';

import { useActiveOperations } from '@/stores/plans';

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
  const { operations } = useActiveOperations();
  if (operations.length === 0) return <EmptyWallet />;
  return allowMissingBonds || operations.some((operation) => operation.ovdp) ? (
    children
  ) : (
    <BondsGate>{children}</BondsGate>
  );
}
