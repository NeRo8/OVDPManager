import { z } from 'zod';

import { CURRENCIES } from '@/lib/portfolio/portfolio';
import { parseAmount } from '@/utils/format';
import { round2 } from '@/utils/number';

/** What the plan's payments in «Роки купівель» do: pay for the purchases or go to the investor. */
const PAYOUT_CHOICES = ['reinvest', 'withdraw'] as const;

/**
 * The coupon goal as typed: the sum comes as text, the rest as choices; whether to reinvest is one
 * of `PAYOUT_CHOICES`. A valid form gives the goal as a plan keeps it.
 */
export const couponGoalFormSchema = z
  .object({
    kind: z.enum(['all', 'ovdp', 'ozdp']),
    currency: z.enum(CURRENCIES),
    year: z.number().int().min(2000).max(9999),
    incomeYears: z.number().int().min(1).max(5),
    purchaseEndYear: z.number().int().min(2000).max(9998),
    purchaseYears: z.number().int().min(1).max(3),
    payouts: z.enum(PAYOUT_CHOICES),
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
  })
  .refine(
    (goal) =>
      goal.purchaseEndYear < goal.year && goal.purchaseEndYear - goal.purchaseYears + 1 >= 2000,
    {
      error: 'Період інвестування має завершуватися до періоду купонів',
    },
  )
  .transform(({ payouts, ...goal }) => ({ ...goal, reinvest: payouts === 'reinvest' }));

/** What the inputs hold. */
export type CouponGoalFormInput = z.input<typeof couponGoalFormSchema>;
/** What a valid form gives. */
export type CouponGoalFormValues = z.output<typeof couponGoalFormSchema>;
