import { useMemo } from 'react';

import {
  type Holding,
  groupPositions,
  positionPayments,
  removeHolding,
  removePosition,
  sumTotals,
  useBonds,
  useHoldings,
} from '@/entities/portfolio';
import {
  formatDate,
  formatMoney,
  todayISO,
  round2,
  confirmDestructive,
  goBackOrHome,
} from '@/shared/lib';

export function useBondDetails(isin: string) {
  const holdings = useHoldings();
  const { byIsin } = useBonds();
  const today = todayISO();
  const bond = byIsin.get(isin);
  const position = useMemo(
    () => groupPositions(holdings.filter((holding) => holding.isin === isin))[0],
    [holdings, isin],
  );
  const payments = useMemo(
    () => (position && bond ? positionPayments(position.lots, bond, today) : []),
    [position, bond, today],
  );
  const currency = bond?.currency ?? 'UAH';
  const hasTopUps = (position?.lots.length ?? 0) > 1;
  const received = sumTotals(payments.filter((payment) => payment.isPaid));
  const expected = sumTotals(payments.filter((payment) => !payment.isPaid));
  const profit = round2(received + expected - (position?.amount ?? 0));
  const canTopUp = !bond || bond.maturityDate > today;

  function deleteLot(lot: Holding) {
    if (!position) return;
    confirmDestructive(
      'Видалити покупку?',
      `${formatDate(lot.purchaseDate)} · ${lot.quantity} шт · ${formatMoney(lot.amount, currency)}`,
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
