import { z } from 'zod';

import { type Bond, canBuyOn } from '@/entities/portfolio';
import { formatDate, parseAmount, round2 } from '@/shared/lib';

/**
 * The purchase form as typed: the inputs give text, the schema turns it into numbers. The date
 * may lie ahead (a planned purchase) but must fall within the bond's life.
 */
export function purchaseFormSchema(bond: Bond) {
  return z.object({
    purchaseDate: z.iso
      .date({ error: 'Вкажіть дату купівлі' })
      .refine((date) => date >= bond.issueDate, {
        error: `ОВДП розміщена ${formatDate(bond.issueDate)} — дата купівлі не може бути раніше`,
      })
      .refine((date) => canBuyOn(bond, date), {
        error: `ОВДП погашається ${formatDate(bond.maturityDate)} — купівля має бути раніше`,
      }),
    quantity: z
      .string()
      .trim()
      .min(1, { error: 'Вкажіть кількість ОВДП' })
      .transform(Number)
      .pipe(
        z
          .number({ error: 'Кількість має бути числом' })
          .int({ error: 'Кількість — ціле число' })
          .positive({ error: 'Кількість має бути більшою за нуль' })
          .max(Number.MAX_SAFE_INTEGER, { error: 'Завелика кількість' }),
      ),
    amount: z
      .string()
      .trim()
      .min(1, { error: 'Вкажіть суму купівлі' })
      .transform((text) => round2(parseAmount(text)))
      .pipe(
        z
          .number({ error: 'Сума має бути числом' })
          .positive({ error: 'Сума має бути більшою за нуль' })
          .max(Number.MAX_SAFE_INTEGER, { error: 'Завелика сума купівлі' }),
      ),
  });
}

type PurchaseFormSchema = ReturnType<typeof purchaseFormSchema>;
/** What the inputs hold. */
export type PurchaseFormInput = z.input<PurchaseFormSchema>;
/** What a valid form gives. */
export type PurchaseFormValues = z.output<PurchaseFormSchema>;
