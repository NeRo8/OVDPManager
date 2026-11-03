import type { Bond, PlanOperation } from './portfolio';

export type LegacyPurchase = Omit<PlanOperation, 'type' | 'ovdp' | 'date'> & {
  purchaseDate: string;
};

/** Keep unrecoverable purchases explicit instead of inventing terms or dropping investments. */
export function migratePurchases(purchases: LegacyPurchase[], bonds: Bond[]): PlanOperation[] {
  const byIsin = new Map(bonds.map((bond) => [bond.isin, bond]));
  return purchases.map(({ purchaseDate, ...purchase }) => ({
    ...purchase,
    date: purchaseDate,
    type: 'purchase',
    ovdp: byIsin.get(purchase.isin) ?? null,
  }));
}
