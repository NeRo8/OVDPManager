import { useState } from 'react';

import {
  addPurchase,
  nextPayment,
  positionPayments,
  sumTotals,
  useWallet,
} from '@/entities/portfolio';
import { formatDate, parseAmount, round2 } from '@/shared/lib';

/**
 * The second step of adding a purchase to the active plan: when, how many and at what price. The
 * date may lie ahead: a planned purchase earns from its date on, like any other.
 */
export function useAddPurchaseForm(isin: string) {
  const { plan, bonds, byIsin, error, refresh, today, positions } = useWallet();
  const bond = byIsin.get(isin) ?? null;

  const [purchaseDate, setPurchaseDate] = useState(today);
  const [quantityText, setQuantityText] = useState('');
  const [enteredPrice, setPriceText] = useState<string | null>(null);
  // NBU gives the nominal, not the price paid: it is only an editable starting value.
  const priceText = enteredPrice ?? (bond ? String(bond.nominal) : '');

  const ownedQuantity =
    positions.find(({ position }) => position.isin === isin)?.position.quantity ?? 0;
  const quantity = Number(quantityText);
  const price = round2(parseAmount(priceText));
  const quantityValid = Number.isSafeInteger(quantity) && quantity > 0;
  const priceValid =
    Number.isFinite(price) && price > 0 && price * quantity <= Number.MAX_SAFE_INTEGER;
  const amount = quantityValid && priceValid ? round2(price * quantity) : null;
  const isPlanned = purchaseDate > today;

  const dateProblem = !bond
    ? null
    : purchaseDate < bond.issueDate
      ? `ОВДП розміщена ${formatDate(bond.issueDate)} — дата купівлі не може бути раніше`
      : purchaseDate >= bond.maturityDate
        ? `ОВДП погашається ${formatDate(bond.maturityDate)} — купівля має бути раніше`
        : null;

  const preview = (() => {
    if (!bond || !quantityValid || dateProblem) return null;
    const payments = positionPayments(
      [{ id: 'preview', isin: bond.isin, purchaseDate, amount: 0, quantity }],
      bond,
      today,
    );
    const income = sumTotals(payments);
    return {
      nextPayment: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      income,
      profit: amount === null ? null : round2(income - amount),
    };
  })();

  /** Why the purchase cannot be saved yet, or null when it can. */
  const problem = !plan
    ? 'Немає активного плану'
    : !bond
      ? 'Немає даних НБУ про цю ОВДП'
      : (dateProblem ??
        (!quantityValid
          ? 'Вкажіть кількість облігацій — ціле число, більше нуля'
          : !priceValid
            ? 'Вкажіть ціну однієї облігації — більше нуля'
            : null));
  const currency = bond?.currency ?? 'UAH';

  /** Adds the purchase to the active plan; false when the form cannot be saved yet. */
  function save(): boolean {
    if (problem || !plan || !bond || amount === null) return false;
    addPurchase({
      planId: plan.id,
      isin: bond.isin,
      purchaseDate,
      amount,
      quantity,
      currency: bond.currency,
    });
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
    quantityText,
    setQuantityText,
    priceText,
    setPriceText,
    amount,
    isPlanned,
    dateProblem,
    preview,
    problem,
    currency,
    save,
  };
}
