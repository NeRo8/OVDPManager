import { useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useWallet } from '@/hooks/useWallet.hook';
import { quantityOn } from '@/lib/portfolio/operations';
import type { Bond } from '@/lib/portfolio/portfolio';
import { showToast } from '@/stores/appSettings';
import { getOperations, updateOperation } from '@/stores/operations';
import { addOperationToActivePlan } from '@/stores/plans';
import { amountInputText } from '@/utils/format';
import { goBackOrHome } from '@/utils/navigation';

import { type SaleFormInput, type SaleFormValues, saleFormSchema } from './saleForm.schema';
import { useHoldOrSell } from './useHoldOrSell.hook';

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
  const submit = () =>
    form.handleSubmit((values) => {
      if (saving.current) return;
      saving.current = true;
      try {
        if (existing) updateOperation(existing.id, values);
        else if (
          !addOperationToActivePlan({
            ...values,
            type: 'sale',
            ovdp: bond,
            isin: bond.isin,
            currency: bond.currency,
          })
        )
          throw new Error('Немає активного плану');
        showToast({
          tone: 'success',
          title: existing ? 'Продаж змінено' : 'Продаж збережено',
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
