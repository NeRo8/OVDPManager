import type { PositionState, WalletPosition } from '@/lib/portfolio/position';

/** Bonds still to mature first, then those redeemed, then those missing from the NBU data. */
const GROUPS = {
  planned: 0,
  inCirculation: 0,
  redeemed: 1,
  unknown: 2,
} as const satisfies Record<PositionState, number>;

const maturityOf = (item: WalletPosition) => item.bond?.maturityDate ?? '';

/**
 * The wallet's rows: bonds still to mature by the nearest maturity first, then those redeemed by
 * the latest redemption first, then those missing from the NBU data; on the same date by ISIN.
 */
export function sortWalletPositions(positions: WalletPosition[]): WalletPosition[] {
  return [...positions].sort((a, b) => {
    const group = GROUPS[a.state] - GROUPS[b.state];
    if (group !== 0) return group;
    const byMaturity =
      GROUPS[a.state] === GROUPS.redeemed
        ? maturityOf(b).localeCompare(maturityOf(a))
        : maturityOf(a).localeCompare(maturityOf(b));
    return byMaturity || a.position.isin.localeCompare(b.position.isin);
  });
}
