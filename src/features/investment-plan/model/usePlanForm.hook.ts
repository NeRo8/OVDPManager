import { useState } from 'react';

import {
  plannedAmount,
  projectPlan,
  savePlannedPurchase,
  useBonds,
  useInvestmentPlans,
  type PlannedPurchase,
} from '@/entities/portfolio';
import { formatDate, parseAmount, round2, todayISO } from '@/shared/lib';

export function usePlanForm(planId: string, isin?: string, id?: string) {
  const plans = useInvestmentPlans();
  const plan = plans.find((item) => item.id === planId);
  const existing = plan?.items.find((item) => item.id === id);
  const { bonds, byIsin, error, refresh } = useBonds();
  const today = todayISO();
  const bond = byIsin.get(existing?.isin ?? isin ?? '');
  const [date, setDate] = useState(existing?.date ?? today);
  const [quantityText, setQuantityText] = useState(existing ? String(existing.quantity) : '');
  const [enteredPrice, setPriceText] = useState<string | null>(
    existing ? String(existing.pricePerBond) : null,
  );
  // NBU provides the nominal, not a future market quote. Keep it as an editable starting value.
  const priceText = enteredPrice ?? (bond ? String(bond.nominal) : '');
  const quantity = Number(quantityText);
  const price = parseAmount(priceText);
  const quantityValid = Number.isSafeInteger(quantity) && quantity > 0;
  const priceValid =
    Number.isFinite(price) &&
    round2(price) > 0 &&
    round2(price) * quantity <= Number.MAX_SAFE_INTEGER;
  const dateProblem = !bond
    ? null
    : date < today
      ? 'Дата запланованої купівлі вже минула'
      : date < bond.issueDate
        ? `ОВДП випущена ${formatDate(bond.issueDate)}`
        : date >= bond.maturityDate
          ? `ОВДП погашається ${formatDate(bond.maturityDate)} — купівля має бути раніше`
          : null;
  const canSave = !!plan && !!bond && !dateProblem && quantityValid && priceValid;
  const draft: PlannedPurchase | null =
    bond && quantityValid && priceValid
      ? {
          id: existing?.id ?? 'preview',
          isin: bond.isin,
          currency: bond.currency,
          date,
          quantity,
          pricePerBond: round2(price),
        }
      : null;
  const forecast = draft && canSave ? projectPlan([draft], byIsin, today) : null;
  const total = forecast?.totals[0];

  function save(): boolean {
    if (!bond || !draft || !canSave) return false;
    savePlannedPurchase(
      planId,
      { isin: bond.isin, currency: bond.currency, date, quantity, pricePerBond: round2(price) },
      existing?.id,
    );
    return true;
  }

  return {
    bonds,
    error,
    refresh,
    bond,
    plan,
    existing,
    today,
    date,
    setDate,
    quantityText,
    setQuantityText,
    priceText,
    setPriceText,
    dateProblem,
    canSave,
    amount: draft ? plannedAmount(draft) : null,
    total,
    nextPayment: forecast?.payments[0],
    save,
  };
}
