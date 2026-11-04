import { useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useCancelPlanned } from '@/hooks/useCancelPlanned.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { quantityOn } from '@/lib/portfolio/operations';
import { type Bond, awaitsConfirmation, plannedByDate } from '@/lib/portfolio/portfolio';
import { showToast } from '@/stores/appSettings';
import { getOperations, updateOperation } from '@/stores/operations';
import { addOperationToActivePlan } from '@/stores/plans';
import { amountInputText } from '@/utils/format';
import { goBackOrHome } from '@/utils/navigation';

import { type SaleFormInput, type SaleFormValues, saleFormSchema } from './saleForm.schema';
import { useHoldOrSell } from './useHoldOrSell.hook';

/** The toast after saving: a new sale, a planned one, one confirmed or one corrected. */
function savedTitle(wasPlanned: boolean | undefined, planned: boolean): string {
  if (wasPlanned === undefined) return planned ? 'Продаж заплановано' : 'Продаж збережено';
  return wasPlanned && !planned ? 'Продаж підтверджено' : 'Продаж змінено';
}

export function useSaleForm(bond: Bond, operationId?: string) {
  const { operations, plan, today } = useWallet();
  const existing = operations.find(
    (operation) => operation.id === operationId && operation.type === 'sale',
  );
  const schema = saleFormSchema(bond, getOperations(), plan!.id, today, existing?.id);
  const saving = useRef(false);
  const form = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      date: existing?.date ?? today,
      quantity: existing ? String(existing.quantity) : '',
      amount: existing ? amountInputText(existing.amount) : '',
    },
  });
  const { isValid } = useFormState({ control: form.control });
  const values = useWatch({ control: form.control });
  const parsed = schema.safeParse(values);
  const price = parsed.success ? parsed.data.amount / parsed.data.quantity : null;
  const { assessment } = useHoldOrSell(bond.isin, price);
  const available = quantityOn(
    operations.filter((operation) => operation.isin === bond.isin && operation.id !== existing?.id),
    values.date ?? today,
  );
  // A planned sale whose date has come: the form asks whether it took place.
  const awaiting = existing ? awaitsConfirmation(existing, today) : false;
  const cancel = useCancelPlanned(existing, goBackOrHome);
  const isPlanned = plannedByDate(values.date ?? today, today);
  const submit = () =>
    form.handleSubmit((values) => {
      if (saving.current) return;
      saving.current = true;
      try {
        // Saved with a date that has come, the sale took place: that is its confirmation.
        const planned = plannedByDate(values.date, today);
        if (existing) updateOperation(existing.id, { ...values, planned });
        else if (
          !addOperationToActivePlan({
            ...values,
            type: 'sale',
            ovdp: bond,
            isin: bond.isin,
            currency: bond.currency,
            planned,
          })
        )
          throw new Error('Немає активного плану');
        showToast({
          tone: 'success',
          title: savedTitle(existing?.planned, planned),
          message: bond.isin,
        });
        goBackOrHome();
      } catch (error) {
        saving.current = false;
        showToast({
          tone: 'error',
          title: 'Продаж не збережено',
          message: error instanceof Error ? error.message : 'Спробуйте ще раз',
        });
      }
    })();
  return {
    awaiting,
    cancel,
    isPlanned,
    control: form.control,
    isValid,
    submit,
    price,
    available,
    assessment:
      !existing &&
      values.date === today &&
      (!values.quantity || (parsed.success && parsed.data.quantity === available))
        ? assessment
        : null,
  };
}
