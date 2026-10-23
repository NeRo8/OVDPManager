import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import {
  type Bond,
  type Purchase,
  addPurchaseToActivePlan,
  annualYield,
  isPlannedPurchase,
  nextPayment,
  pricePerBond,
  positionPayments,
  purchaseResults,
  useBonds,
  useKeyRate,
} from '@/entities/portfolio';
import { todayISO } from '@/shared/lib';
import {
  type PurchaseFormInput,
  type PurchaseFormValues,
  purchaseFormSchema,
} from './purchaseForm.schema';
import { purchaseHints, purchaseVerdict } from './purchaseHints';

/**
 * The second step of adding a purchase to the active plan: when, how many and for how much.
 * Validated on every change, so Save is enabled only for a purchase that can be stored.
 */
export function useAddPurchaseForm(bond: Bond, onSaved: () => void) {
  const { bonds, byIsin } = useBonds();
  const today = todayISO();
  const schema = purchaseFormSchema(bond);
  const form = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    // The amount is what the bank or broker charged for the whole purchase, as their apps show it.
    defaultValues: { purchaseDate: today, quantity: '', amount: '' },
  });

  // Read through hooks, not `form.formState`: the React Compiler would cache a read of the stable
  // `form` object, and the Save button would stop following the form.
  const { isValid } = useFormState({ control: form.control });
  const values = useWatch({ control: form.control });
  const purchaseDate = values.purchaseDate ?? today;
  const keyRate = useKeyRate(purchaseDate);
  const draft = schema.safeParse(values);
  const valid = draft.success ? draft.data : null;
  const price = valid ? pricePerBond(valid.amount, valid.quantity) : null;
  const isPlanned = isPlannedPurchase({ purchaseDate }, today);

  const preview = (() => {
    if (!valid || price === null) return null;
    const draft: Purchase = {
      id: 'draft',
      isin: bond.isin,
      purchaseDate: valid.purchaseDate,
      amount: valid.amount,
      quantity: valid.quantity,
    };
    // The bond comes from the NBU data, so its results are always there.
    const results = purchaseResults([draft], byIsin, today).at(0);
    if (!results) return null;
    const payments = positionPayments([draft], bond, today);
    const yearly = results.complete
      ? annualYield(valid.amount, valid.purchaseDate, payments)
      : null;
    const hints = purchaseHints({
      bond,
      purchaseDate: valid.purchaseDate,
      pricePerBond: price,
      netIncome: results.netIncome,
      isComplete: results.complete,
      annualYield: yearly,
      keyRate,
      bonds: bonds ?? [],
    });
    return {
      nextPayment: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      totalPayments: results.totalPayments,
      netIncome: results.netIncome,
      returnPercent: results.returnPercent,
      annualYield: yearly,
      hints,
      verdict: purchaseVerdict(hints),
    };
  })();

  const submit = form.handleSubmit(({ purchaseDate, quantity, amount }) => {
    addPurchaseToActivePlan({
      isin: bond.isin,
      purchaseDate,
      amount,
      quantity,
      currency: bond.currency,
    });
    onSaved();
  });

  return {
    control: form.control,
    isValid,
    submit,
    purchaseDate,
    pricePerBond: price,
    isPlanned,
    preview,
  };
}
