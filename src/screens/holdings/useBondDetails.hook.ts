import { useWallet } from '@/hooks/useWallet.hook';
import { type Operation, canBuyOn, purchaseCurrency } from '@/lib/portfolio/portfolio';
import { showToast } from '@/stores/appSettings';
import { removeOperation } from '@/stores/operations';
import { removePositionFromActivePlan } from '@/stores/plans';
import { confirmDestructive } from '@/utils/confirm';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';
import { goBackOrHome } from '@/utils/navigation';

export function useBondDetails(isin: string) {
  const { positions, byIsin, today } = useWallet();
  const bond = byIsin.get(isin);
  /** The Position with its payments, results and yields; missing when the wallet has no such bond */
  const item = positions.find(({ position }) => position.isin === isin);
  const position = item?.position;
  const payments = item?.payments ?? [];
  const hasTopUps = (position?.operations.length ?? 0) > 1;
  const canTopUp = !!bond && canBuyOn(bond, today);

  function deletePurchase(purchase: Operation) {
    if (!position) return;
    confirmDestructive(
      purchase.type === 'sale' ? 'Видалити продаж?' : 'Видалити купівлю?',
      `${formatDate(purchase.date)} · ${purchase.quantity} шт · ${formatMoney(purchase.amount, purchaseCurrency(purchase, bond))}`,
      'Видалити',
      () => {
        try {
          removeOperation(purchase.id);
        } catch (error) {
          showToast({
            tone: 'error',
            title: 'Операцію не видалено',
            message: error instanceof Error ? error.message : 'Спробуйте ще раз',
          });
          return;
        }
        if (position.operations.length === 1) goBackOrHome();
        showToast({ tone: 'success', title: 'Операцію видалено', message: position.isin });
      },
    );
  }

  function deletePosition() {
    if (!position) return;
    confirmDestructive(
      'Видалити ОВДП?',
      `${position.isin} і всі операції (${position.operations.length}) буде видалено з гаманця.`,
      'Видалити',
      () => {
        goBackOrHome();
        removePositionFromActivePlan(position.isin);
        showToast({ tone: 'success', title: 'ОВДП видалено з гаманця', message: position.isin });
      },
    );
  }

  return {
    today,
    item,
    position,
    bond,
    payments,
    hasTopUps,
    canTopUp,
    deletePurchase,
    deletePosition,
  };
}
