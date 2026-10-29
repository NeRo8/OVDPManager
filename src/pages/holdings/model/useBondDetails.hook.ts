import {
  type Purchase,
  canBuyOn,
  purchaseCurrency,
  removePurchase,
  removePositionFromActivePlan,
  useWallet,
} from '@/entities/portfolio';

import { formatDate, formatMoney, confirmDestructive, goBackOrHome } from '@/shared/lib';

export function useBondDetails(isin: string) {
  const { positions, byIsin, today } = useWallet();
  const bond = byIsin.get(isin);
  const walletPosition = positions.find(({ position }) => position.isin === isin);
  const position = walletPosition?.position;
  const payments = walletPosition?.payments ?? [];
  /** Comes with the position */
  const currency = walletPosition?.currency;
  const hasTopUps = (position?.purchases.length ?? 0) > 1;
  /** Missing when the NBU data has no such bond */
  const results = walletPosition?.results;
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
      },
    );
  }

  return {
    today,
    position,
    bond,
    payments,
    currency,
    hasTopUps,
    results,
    canTopUp,
    deletePurchase,
    deletePosition,
  };
}
