import { useBonds, useKeyRate, useWallet } from '@/entities/portfolio';

import { holdOrSell } from './holdOrSell';

/**
 * Whether to keep a bond of the wallet or sell it today, at `salePrice` per bond when one is
 * typed. Null for a bond the wallet does not hold or that cannot be sold.
 */
export function useHoldOrSell(isin: string, salePrice: number | null) {
  const { positions, byIsin, today } = useWallet();
  const { bonds } = useBonds();
  const keyRate = useKeyRate(today);
  const bond = byIsin.get(isin);
  const position = positions.find((item) => item.position.isin === isin)?.position;
  return {
    bond,
    assessment:
      position && bond
        ? holdOrSell({ position, bond, today, keyRate, bonds: bonds ?? [], salePrice })
        : null,
  };
}
