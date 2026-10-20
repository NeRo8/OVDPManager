import { useMemo, useState } from 'react';

import { addHolding, useHoldings, useBonds } from '@/entities/portfolio';
import { type Bond, nextPayment, positionPayments, searchBonds } from '@/entities/portfolio';
import { round2 } from '@/shared/lib/number';
import { formatDate, formatMoney, parseAmount, toISODate } from '@/shared/lib';
import { goBackOrHome } from '@/shared/lib/navigation';

export function useAddHoldingForm(topUpIsin?: string) {
  const { bonds, byIsin, error, refresh } = useBonds();
  const holdings = useHoldings();
  const today = toISODate(new Date());

  const [query, setQuery] = useState(topUpIsin ?? '');
  const [selected, setSelected] = useState<Bond | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [amountText, setAmountText] = useState('');
  const [quantityText, setQuantityText] = useState('');

  const bond = selected ?? byIsin.get(query.trim().toUpperCase()) ?? null;
  const matches = useMemo(
    () => (bond || !bonds ? [] : searchBonds(bonds, query, today, 8)),
    [bond, bonds, query, today],
  );

  const ownedQuantity = bond
    ? holdings.filter((h) => h.isin === bond.isin).reduce((sum, h) => sum + h.quantity, 0)
    : 0;
  const amount = parseAmount(amountText);
  const quantity = Number(quantityText);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const quantityValid = Number.isInteger(quantity) && quantity > 0;

  const dateProblem = !bond
    ? null
    : purchaseDate < bond.issueDate
      ? `ОВДП розміщена ${formatDate(bond.issueDate)} — дата купівлі не може бути раніше`
      : purchaseDate >= bond.maturityDate
        ? `ОВДП погашена ${formatDate(bond.maturityDate)}`
        : null;

  const preview = useMemo(() => {
    if (!bond || !quantityValid) return null;
    const payments = positionPayments(
      [{ id: 'preview', isin: bond.isin, purchaseDate, amount: 0, quantity }],
      bond,
      today,
    );
    return {
      next: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      income: round2(payments.reduce((sum, p) => sum + p.total, 0)),
    };
  }, [bond, quantityValid, purchaseDate, quantity, today]);

  const canSave = !!bond && !dateProblem && amountValid && quantityValid;
  const currency = bond?.currency ?? 'UAH';
  const coupon = bond?.payments.find((p) => p.type === 'coupon');
  const couponPerBond = bond
    ? coupon
      ? formatMoney(coupon.amount, bond.currency)
      : 'без купону'
    : '';

  function save() {
    if (!bond || !canSave) return;
    addHolding({ isin: bond.isin, purchaseDate, amount: round2(amount), quantity });
    goBackOrHome();
  }

  function onChangeQuery(text: string) {
    setQuery(text);
    setSelected(null);
  }

  return {
    bonds,
    error,
    refresh,
    today,
    query,
    selected,
    setSelected,
    onChangeQuery,
    bond,
    matches,
    ownedQuantity,
    purchaseDate,
    setPurchaseDate,
    amountText,
    setAmountText,
    quantityText,
    setQuantityText,
    amount,
    quantity,
    amountValid,
    quantityValid,
    dateProblem,
    preview,
    canSave,
    currency,
    couponPerBond,
    save,
  };
}
