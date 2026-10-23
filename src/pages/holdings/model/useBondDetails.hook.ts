import {
  type Purchase,
  purchaseCurrency,
  purchaseResults,
  removePurchase,
  removePosition,
  useWallet,
} from '@/entities/portfolio';
import { formatDate, formatMoney, confirmDestructive, goBackOrHome } from '@/shared/lib';

export function useBondDetails(isin: string) {
  const { plan, positions, byIsin, today } = useWallet();
  const bond = byIsin.get(isin);
  const walletPosition = positions.find(({ position }) => position.isin === isin);
  const position = walletPosition?.position;
  const payments = walletPosition?.payments ?? [];
  const currency = walletPosition?.currency ?? null;
  const hasTopUps = (position?.purchases.length ?? 0) > 1;
  /** Missing when the NBU data has no such bond */
  const results = purchaseResults(position?.purchases ?? [], byIsin, today).at(0);
  const canTopUp = !!bond && bond.maturityDate > today;

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
    if (!plan || !position) return;
    confirmDestructive(
      'Видалити ОВДП?',
      `${position.isin} і всі купівлі (${position.purchases.length}) буде видалено з гаманця.`,
      'Видалити',
      () => {
        goBackOrHome();
        removePosition(plan.id, position.isin);
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
