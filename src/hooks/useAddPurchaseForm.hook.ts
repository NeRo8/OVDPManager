import { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import {
  type PurchaseFormInput,
  type PurchaseFormValues,
  purchaseFormSchema,
} from '@/lib/add-purchase/purchaseForm.schema';
import { purchasePreview } from '@/lib/add-purchase/purchasePreview';
import {
  type Bond,
  type Purchase,
  isPlannedPurchase,
  pricePerBond,
} from '@/lib/portfolio/portfolio';
import { addPurchaseToActivePlan } from '@/stores/activePlan';
import { useToday, showToast } from '@/stores/appSettings';
import { updatePurchase } from '@/stores/purchases';

import { useBonds } from './useBonds.hook';
import { useKeyRate } from './useKeyRate.hook';

/** The amount as the input shows it, with a decimal comma. */
const amountText = (amount: number) => String(amount).replace('.', ',');

/**
 * The final step of adding a purchase to the active plan: when, how many and for how much. With
 * `purchase` it edits that one instead («Підтвердити купівлю» / «Змінити купівлю»), starting from
 * its figures. Validated on every change, so Save is enabled only for a purchase that can be stored.
 */
export function useAddPurchaseForm(bond: Bond, onSaved: () => void, purchase?: Purchase) {
  const saving = useRef(false);
  const { bonds } = useBonds();
  const today = useToday();
  const schema = purchaseFormSchema(bond);
  const form = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    // The amount is what the bank or broker charged for the whole purchase, as their apps show it.
    defaultValues: purchase
      ? {
          purchaseDate: purchase.purchaseDate,
          quantity: String(purchase.quantity),
          amount: amountText(purchase.amount),
        }
      : { purchaseDate: today, quantity: '', amount: '' },
  });

  // A new purchase starts today, which a bond no longer for sale (or not yet placed) does not allow:
  // the date's error shows at once, rather than Save staying off without a reason.
  useEffect(() => {
    if (!purchase) void form.trigger('purchaseDate');
  }, [form, purchase]);

  // Read through hooks, not `form.formState`: the React Compiler would cache a read of the stable
  // `form` object, and the Save button would stop following the form.
  const { isValid } = useFormState({ control: form.control });
  const values = useWatch({ control: form.control });
  const purchaseDate = values.purchaseDate ?? today;
  const { rate: keyRate, failed: keyRateFailed } = useKeyRate(purchaseDate);
  const parsed = schema.safeParse(values);
  // The price shows as soon as the amount and the quantity are valid, whatever the date.
  const amount = schema.shape.amount.safeParse(values.amount);
  const quantity = schema.shape.quantity.safeParse(values.quantity);
  const price =
    amount.success && quantity.success ? pricePerBond(amount.data, quantity.data) : null;
  const isPlanned = isPlannedPurchase({ purchaseDate }, today);
  const preview = parsed.success
    ? purchasePreview({
        bond,
        values: parsed.data,
        today,
        keyRate,
        keyRateFailed,
        bonds: bonds ?? [],
      })
    : null;

  const submit = () =>
    form.handleSubmit(({ purchaseDate, quantity, amount }) => {
      if (saving.current) return;
      saving.current = true;
      if (purchase) {
        updatePurchase(purchase.id, { purchaseDate, quantity, amount });
        showToast({ tone: 'success', title: 'Купівлю змінено', message: bond.isin });
        onSaved();
        return;
      }
      const saved = addPurchaseToActivePlan({
        isin: bond.isin,
        purchaseDate,
        amount,
        quantity,
        currency: bond.currency,
      });
      if (!saved) {
        saving.current = false;
        showToast({
          tone: 'error',
          title: 'Не вдалося зберегти купівлю',
          message: 'Немає активного плану.',
        });
        return;
      }
      showToast({ tone: 'success', title: 'Купівлю додано', message: bond.isin });
      onSaved();
    })();

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
