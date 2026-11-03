import { z } from 'zod';

import { parseAmount } from '@/utils/format';
import { round2 } from '@/utils/number';

/** The sale price per bond as typed: empty while none is typed, else a positive amount. */
export const salePriceSchema = z.object({
  price: z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : round2(parseAmount(text))))
    .pipe(
      z
        .number({ error: 'Ціна має бути числом' })
        .positive({ error: 'Ціна має бути більшою за нуль' })
        .max(Number.MAX_SAFE_INTEGER, { error: 'Завелика ціна' })
        .nullable(),
    ),
});

/** What the input holds. */
export type SalePriceInput = z.input<typeof salePriceSchema>;
/** What a valid input gives. */
export type SalePriceValues = z.output<typeof salePriceSchema>;
