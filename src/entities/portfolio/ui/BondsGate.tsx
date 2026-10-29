import type { ReactNode } from 'react';

import { useBonds } from '../api/useBonds.hook';

import { BondsUnavailable } from './BondsUnavailable';

type Props = {
  children: ReactNode;
};

/** Shows `children` once there is NBU data; until then the screen waits for it or offers a retry. */
export function BondsGate({ children }: Props) {
  const { bonds, error, refresh } = useBonds();
  if (!bonds) return <BondsUnavailable error={error} onRetry={refresh} />;
  return children;
}
