import { useMemo, useState } from 'react';

import {
  addHolding,
  nextPayment,
  positionPayments,
  sumTotals,
  useWallet,
} from '@/entities/portfolio';
import { formatDate, parseAmount, round2 } from '@/shared/lib';

/** The second step of adding a purchase: what was paid for the chosen bond, and when. */
export function useAddHoldingForm(isin: string) {
  const { bonds, byIsin, error, refresh, today, positions } = useWallet();

  const [purchaseDate, setPurchaseDate] = useState(today);
  const [amountText, setAmountText] = useState('');
  const [quantityText, setQuantityText] = useState('');

  const bond = byIsin.get(isin) ?? null;
  const ownedQuantity =
    positions.find(({ position }) => position.isin === isin)?.position.quantity ?? 0;
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

  /** Adds the purchase; false when the form cannot be saved yet. */
  function save(): boolean {
    if (!bond || !canSave) return false;
    addHolding({ isin: bond.isin, purchaseDate, amount: round2(amount), quantity });
    return true;
  }

  return {
    bonds,
    error,
    refresh,
    today,
    bond,
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
