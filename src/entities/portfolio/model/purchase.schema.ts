import { z } from 'zod';

import { CURRENCIES, type WalletPurchase } from './portfolio';

/**
 * What the user enters for a purchase. Messages finish the sentence "Покупка №N: …", so a
 * rejected backup says which field is wrong.
 */
export const PurchaseInputSchema = z.object({
  isin: z
    .string({ error: 'немає номера ОВДП (ISIN)' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[A-Z0-9]{10}$/, { error: 'номер ОВДП (ISIN) має бути з 12 символів' }),
  purchaseDate: z.iso.date({ error: 'дата купівлі має бути у форматі РРРР-ММ-ДД' }),
  amount: z
    .number({ error: 'сума має бути числом' })
    .positive({ error: 'сума має бути більшою за нуль' }),
  quantity: z
    .number({ error: 'кількість має бути числом' })
    .int({ error: 'кількість має бути цілим числом' })
    .positive({ error: 'кількість має бути більшою за нуль' }),
  currency: z.enum(CURRENCIES, { error: 'валюта має бути UAH, USD або EUR' }).optional(),
});

/** A purchase in the wallet. */
export const PurchaseSchema = PurchaseInputSchema.extend({
  id: z.string().min(1),
  planId: z.string().min(1),
}) satisfies z.ZodType<WalletPurchase>;
