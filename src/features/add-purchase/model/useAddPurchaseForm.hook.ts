import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import {
  type Bond,
  addPurchase,
  annualYield,
  nextPayment,
  positionPayments,
  sumTotals,
  useActivePlan,
  useBonds,
  useKeyRate,
} from '@/entities/portfolio';
import { round2, todayISO } from '@/shared/lib';
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
  const plan = useActivePlan();
  const { bonds } = useBonds();
  const keyRate = useKeyRate();
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
  const draft = schema.safeParse(values);
  const valid = draft.success ? draft.data : null;
  const pricePerBond = valid ? valid.amount / valid.quantity : null;
  const isPlanned = (values.purchaseDate ?? today) > today;

  const preview = (() => {
    if (!valid) return null;
    const payments = positionPayments(
      [
        {
          id: 'preview',
          isin: bond.isin,
          purchaseDate: valid.purchaseDate,
          amount: 0,
          quantity: valid.quantity,
        },
      ],
      bond,
      today,
    );
    const income = sumTotals(payments);
    const profit = round2(income - valid.amount);
    // Without the redemption row NBU has not published yet, the payments fall short of the truth.
    const isComplete = bond.payments.some((payment) => payment.type === 'redemption');
    const yearly = isComplete ? annualYield(valid.amount, valid.purchaseDate, payments) : null;
    const hints = purchaseHints({
      bond,
      purchaseDate: valid.purchaseDate,
      pricePerBond: valid.amount / valid.quantity,
      profit,
      isComplete,
      annualYield: yearly,
      keyRate,
      bonds: bonds ?? [],
    });
    return {
      nextPayment: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      income,
      profit,
      isComplete,
      totalReturn: isComplete ? round2((profit / valid.amount) * 100) : null,
      annualYield: yearly,
      hints,
      verdict: purchaseVerdict(hints),
    };
  })();

  const submit = form.handleSubmit(({ purchaseDate, quantity, amount }) => {
    // The app's screens open only once there is a plan, so one is always active here.
    if (!plan) return;
    addPurchase({
      planId: plan.id,
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
    purchaseDate: values.purchaseDate ?? today,
    pricePerBond,
    isPlanned,
    preview,
  };
}
