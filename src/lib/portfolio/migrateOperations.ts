import { type Bond, type PlanOperation, plannedByDate } from './portfolio';

export type LegacyPurchase = Omit<PlanOperation, 'type' | 'ovdp' | 'date' | 'planned'> & {
  purchaseDate: string;
};

/** Keep unrecoverable purchases explicit instead of inventing terms or dropping investments. */
export function migratePurchases(
  purchases: LegacyPurchase[],
  bonds: Bond[],
  today: string,
): PlanOperation[] {
  const byIsin = new Map(bonds.map((bond) => [bond.isin, bond]));
  return purchases.map(({ purchaseDate, ...purchase }) => ({
    ...purchase,
    date: purchaseDate,
    type: 'purchase',
    ovdp: byIsin.get(purchase.isin) ?? null,
    planned: plannedByDate(purchaseDate, today),
  }));
}

/**
 * Operations saved before confirmation existed: those dated ahead stay planned, the others were
 * already counted as made once their date came, and still are. An operation dated ahead is planned
 * whatever it says, as one that has not happened yet cannot be confirmed.
 */
export function withPlannedFlags<T extends Omit<PlanOperation, 'planned'>>(
  operations: (T & { planned?: boolean })[],
  today: string,
): (T & { planned: boolean })[] {
  return operations.map((operation) => ({
    ...operation,
    planned: operation.planned === true || plannedByDate(operation.date, today),
  }));
}
