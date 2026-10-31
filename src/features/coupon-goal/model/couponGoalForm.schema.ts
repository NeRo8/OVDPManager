import { z } from 'zod';

import { CURRENCIES } from '@/entities/portfolio';

import { parseAmount, round2 } from '@/shared/lib';

/** The coupon goal as typed: the sum comes as text, the currency and the year as choices. */
export const couponGoalFormSchema = z.object({
  currency: z.enum(CURRENCIES),
  year: z.number().int(),
  monthly: z
    .string()
    .trim()
    .min(1, { error: 'Вкажіть, скільки купонів хочете щомісяця' })
    .transform((text) => round2(parseAmount(text)))
    .pipe(
      z
        .number({ error: 'Сума має бути числом' })
        .positive({ error: 'Сума має бути більшою за нуль' })
        .max(Number.MAX_SAFE_INTEGER, { error: 'Завелика сума' }),
    ),
});

/** What the inputs hold. */
export type CouponGoalFormInput = z.input<typeof couponGoalFormSchema>;
/** What a valid form gives. */
export type CouponGoalFormValues = z.output<typeof couponGoalFormSchema>;
