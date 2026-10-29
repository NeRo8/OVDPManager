import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { type SalePriceInput, type SalePriceValues, salePriceSchema } from './salePrice.schema';
import { useHoldOrSell } from './useHoldOrSell.hook';

/**
 * The sale of a bond of the wallet at the price a bank or a broker quotes today. The price is not
 * saved: the form only weighs selling against keeping.
 */
export function useSaleForm(isin: string) {
  const form = useForm<SalePriceInput, unknown, SalePriceValues>({
    resolver: zodResolver(salePriceSchema),
    mode: 'onChange',
    defaultValues: { price: '' },
  });
  // Read through `useWatch`, not `form.formState` or `form.getValues`: the React Compiler would
  // cache a read of the stable `form` object.
  const values = useWatch({ control: form.control });
  const parsed = salePriceSchema.safeParse(values);
  const salePrice = parsed.success ? parsed.data.price : null;

  return { control: form.control, salePrice, ...useHoldOrSell(isin, salePrice) };
}
