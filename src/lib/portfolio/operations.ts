import type { Bond, Operation, PlanOperation } from './portfolio';

/** Same-day purchases precede sales; payments precede both. */
export function compareOperations(a: Operation, b: Operation): number {
  return (
    a.date.localeCompare(b.date) ||
    Number(a.type === 'sale') - Number(b.type === 'sale') ||
    a.id.localeCompare(b.id)
  );
}

export function signedQuantity(operation: Operation): number {
  return operation.type === 'purchase' ? operation.quantity : -operation.quantity;
}

export function quantityOn(operations: Operation[], date: string): number {
  return operations
    .filter((operation) => operation.date <= date)
    .reduce((sum, operation) => sum + signedQuantity(operation), 0);
}

/** A validation boundary shared by forms and backup restore, including edits/deletions. */
export function operationHistoryError(operations: PlanOperation[]): string | undefined {
  const balances = new Map<string, number>();
  for (const operation of [...operations].sort(compareOperations)) {
    const key = JSON.stringify([operation.planId, operation.isin]);
    const balance = (balances.get(key) ?? 0) + signedQuantity(operation);
    if (balance < 0)
      return `Продаж ${operation.isin} від ${operation.date} перевищує кількість ОВДП у плані на цю дату.`;
    balances.set(key, balance);
  }
}

/** FIFO allocates a sale to purchases without changing any recorded operation. */
export function purchaseLots(operations: Operation[]) {
  const lots: {
    purchase: Operation;
    remaining: number;
    sales: { date: string; quantity: number; total: number }[];
  }[] = [];
  for (const operation of [...operations].sort(compareOperations)) {
    if (operation.type === 'purchase') {
      lots.push({ purchase: operation, remaining: operation.quantity, sales: [] });
      continue;
    }
    let remaining = operation.quantity;
    for (const lot of lots) {
      const quantity = Math.min(lot.remaining, remaining);
      if (quantity > 0) {
        lot.sales.push({
          date: operation.date,
          quantity,
          total: (operation.amount * quantity) / operation.quantity,
        });
        lot.remaining -= quantity;
        remaining -= quantity;
      }
      if (remaining === 0) break;
    }
  }
  return lots;
}

/** Missing rows never erase history. Past rows keep their saved amounts; future rows can be corrected. */
export function mergeBond(saved: Bond | null, fetched: Bond, today: string): Bond {
  if (!saved) return fetched;
  const payments = new Map(
    saved.payments.map((payment) => [`${payment.date}:${payment.type}`, payment]),
  );
  for (const payment of fetched.payments) {
    const key = `${payment.date}:${payment.type}`;
    if (!payments.has(key) || payment.date >= today) payments.set(key, payment);
  }
  return {
    ...fetched,
    isin: saved.isin,
    currency: saved.currency,
    payments: [...payments.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type),
    ),
  };
}

/** Resolve embedded snapshots first. The catalog only fills bonds missing from legacy purchases. */
export function operationBonds(
  operations: Operation[],
  catalog: Map<string, Bond>,
  today: string,
): Map<string, Bond> {
  const saved = new Map<string, Bond>();
  for (const operation of operations) {
    if (operation.ovdp)
      saved.set(
        operation.isin,
        mergeBond(saved.get(operation.isin) ?? null, operation.ovdp, today),
      );
  }
  return new Map([...catalog, ...saved]);
}

/** Every copy of an ISIN receives the same merged schedule, across all plans. */
export function refreshOperationBonds(
  operations: PlanOperation[],
  bonds: Bond[],
  today: string,
): PlanOperation[] {
  const byIsin = operationBonds(operations, new Map(), today);
  for (const bond of bonds)
    byIsin.set(bond.isin, mergeBond(byIsin.get(bond.isin) ?? null, bond, today));
  return operations.map((operation) => ({
    ...operation,
    ovdp: byIsin.get(operation.isin) ?? null,
  }));
}
