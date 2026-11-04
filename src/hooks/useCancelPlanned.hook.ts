import type { Operation } from '@/lib/portfolio/portfolio';
import { showToast } from '@/stores/appSettings';
import { removeOperation } from '@/stores/operations';
import { confirmDestructive } from '@/utils/confirm';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';

/**
 * «Не відбулась»: removes a planned operation that did not take place, once the user agrees. A
 * removal that would leave a later sale without bonds is refused, as any removal is.
 */
export function useCancelPlanned(operation: Operation | undefined, onRemoved: () => void) {
  return () => {
    if (!operation) return;
    const isSale = operation.type === 'sale';
    confirmDestructive(
      isSale ? 'Продаж не відбувся?' : 'Купівля не відбулась?',
      `${formatDate(operation.date)} · ${operation.quantity} шт · ${formatMoney(operation.amount, operation.currency)}. Операцію буде видалено з плану.`,
      'Видалити',
      () => {
        try {
          removeOperation(operation.id);
        } catch (error) {
          showToast({
            tone: 'error',
            title: 'Операцію не видалено',
            message: error instanceof Error ? error.message : 'Спробуйте ще раз',
          });
          return;
        }
        showToast({
          tone: 'success',
          title: isSale ? 'Продаж видалено' : 'Купівлю видалено',
          message: operation.isin,
        });
        onRemoved();
      },
    );
  };
}
