import {
  type Purchase,
  canBuyOn,
  purchaseCurrency,
  removePurchase,
  removePositionFromActivePlan,
  useWallet,
} from '@/entities/portfolio';

import { formatDate, formatMoney, confirmDestructive, goBackOrHome, showToast } from '@/shared/lib';

export function useBondDetails(isin: string) {
  const { positions, byIsin, today } = useWallet();
  const bond = byIsin.get(isin);
  /** The Position with its payments, results and yields; missing when the wallet has no such bond */
  const item = positions.find(({ position }) => position.isin === isin);
  const position = item?.position;
  const payments = item?.payments ?? [];
  const hasTopUps = (position?.purchases.length ?? 0) > 1;
  const canTopUp = !!bond && canBuyOn(bond, today);

  function deletePurchase(purchase: Purchase) {
    if (!position) return;
    confirmDestructive(
      'Видалити купівлю?',
      `${formatDate(purchase.purchaseDate)} · ${purchase.quantity} шт · ${formatMoney(purchase.amount, purchaseCurrency(purchase, bond))}`,
      'Видалити',
      () => {
        if (position.purchases.length === 1) goBackOrHome();
        removePurchase(purchase.id);
        showToast({ tone: 'success', title: 'Купівлю видалено', message: position.isin });
      },
    );
  }

  function deletePosition() {
    if (!position) return;
    confirmDestructive(
      'Видалити ОВДП?',
      `${position.isin} і всі купівлі (${position.purchases.length}) буде видалено з гаманця.`,
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
