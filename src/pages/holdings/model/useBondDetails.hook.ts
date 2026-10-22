import {
  type Holding,
  holdingCurrency,
  removeHolding,
  removePosition,
  sumTotals,
  useWallet,
} from '@/entities/portfolio';
import { formatDate, formatMoney, round2, confirmDestructive, goBackOrHome } from '@/shared/lib';

export function useBondDetails(isin: string) {
  const { positions, byIsin, today } = useWallet();
  const bond = byIsin.get(isin);
  const walletPosition = positions.find(({ position }) => position.isin === isin);
  const position = walletPosition?.position;
  const payments = walletPosition?.payments ?? [];
  const currency = walletPosition?.currency ?? null;
  const hasTopUps = (position?.lots.length ?? 0) > 1;
  const received = sumTotals(payments.filter((payment) => payment.isPaid));
  const expected = sumTotals(payments.filter((payment) => !payment.isPaid));
  const profit = round2(received + expected - (position?.amount ?? 0));
  const canTopUp = !!bond && bond.maturityDate > today;

  function deleteLot(lot: Holding) {
    if (!position) return;
    confirmDestructive(
      'Видалити покупку?',
      `${formatDate(lot.purchaseDate)} · ${lot.quantity} шт · ${formatMoney(lot.amount, holdingCurrency(lot, bond))}`,
      'Видалити',
      () => {
        if (position.lots.length === 1) goBackOrHome();
        removeHolding(lot.id);
      },
    );
  }

  function deletePosition() {
    if (!position) return;
    confirmDestructive(
      'Видалити ОВДП?',
      `${position.isin} і всі покупки (${position.lots.length}) буде видалено з гаманця.`,
      'Видалити',
      () => {
        goBackOrHome();
        removePosition(position.isin);
      },
    );
  }

  return {
    position,
    bond,
    payments,
    currency,
    hasTopUps,
    received,
    expected,
    profit,
    canTopUp,
    deleteLot,
    deletePosition,
  };
}
