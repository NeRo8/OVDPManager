import { type Operation, awaitsConfirmation } from '@/lib/portfolio/portfolio';

/**
 * The sale screen's title, the same in the header while it slides in and once it is there:
 * confirming a planned sale whose date has come, or a sale to record or change.
 */
export function saleScreenTitle(
  operations: Operation[],
  operationId: string | undefined,
  today: string,
): string {
  const sale = operations.find(
    (operation) => operation.id === operationId && operation.type === 'sale',
  );
  return sale && awaitsConfirmation(sale, today) ? 'Підтвердити продаж' : 'Продаж';
}
