import { z } from 'zod';

import { CURRENCIES } from '@/entities/portfolio';

import { isAmbiguousAmount, parseAmount, round2 } from '@/shared/lib';

/** What the plan's payments in «Роки купівель» do: pay for the purchases or go to the investor. */
const PAYOUT_CHOICES = ['reinvest', 'withdraw'] as const;

/**
 * The coupon goal as typed: the sum comes as text, the rest as choices; whether to reinvest is one
 * of `PAYOUT_CHOICES`. A valid form gives the goal as a plan keeps it.
 */
export const couponGoalFormSchema = z
  .object({
    currency: z.enum(CURRENCIES),
    year: z.number().int(),
    incomeYears: z.number().int().positive(),
    purchaseYears: z.number().int().positive(),
    payouts: z.enum(PAYOUT_CHOICES),
    monthly: z
      .string()
      .trim()
      .min(1, { error: 'Вкажіть, скільки купонів хочете щомісяця' })
      .refine((text) => !isAmbiguousAmount(text), {
        error: 'Використайте пробіл для тисяч або вкажіть до двох десяткових знаків',
      })
      .transform((text) => round2(parseAmount(text)))
      .pipe(
        z
          .number({ error: 'Сума має бути числом' })
          .positive({ error: 'Сума має бути більшою за нуль' })
          .max(Number.MAX_SAFE_INTEGER, { error: 'Завелика сума' }),
      ),
  })
  .transform(({ payouts, ...goal }) => ({ ...goal, reinvest: payouts === 'reinvest' }));

/** What the inputs hold. */
export type CouponGoalFormInput = z.input<typeof couponGoalFormSchema>;
/** What a valid form gives. */
export type CouponGoalFormValues = z.output<typeof couponGoalFormSchema>;
