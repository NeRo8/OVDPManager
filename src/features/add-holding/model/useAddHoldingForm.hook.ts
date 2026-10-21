import { useMemo, useState } from 'react';

import {
  type Bond,
  addHolding,
  nextPayment,
  positionPayments,
  searchBonds,
  sumTotals,
  useBonds,
  useHoldings,
} from '@/entities/portfolio';
import { formatDate, parseAmount, todayISO, round2, goBackOrHome } from '@/shared/lib';

export function useAddHoldingForm(topUpIsin?: string) {
  const { bonds, byIsin, error, refresh } = useBonds();
  const holdings = useHoldings();
  const today = todayISO();

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
    const income = sumTotals(payments);
    return {
      next: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      income,
      profit: amountValid ? round2(income - amount) : null,
    };
  }, [bond, quantityValid, purchaseDate, quantity, today, amountValid, amount]);

  const pricePerBond = amountValid && quantityValid ? round2(amount / quantity) : null;
  /** Expected quantity at par, as a hint while only the amount is entered. */
  const quantityPlaceholder =
    bond && amountValid ? `≈ ${Math.max(1, Math.round(amount / bond.nominal))}` : '0';
  const canSave = !!bond && !dateProblem && amountValid && quantityValid;
  const currency = bond?.currency ?? 'UAH';

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
    quantityPlaceholder,
    pricePerBond,
    dateProblem,
    preview,
    canSave,
    currency,
    save,
  };
}
