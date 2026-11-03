import { z } from 'zod';

import { purchaseFormSchema } from '@/lib/add-purchase/purchaseForm.schema';
import { operationHistoryError } from '@/lib/portfolio/operations';
import type { Bond, PlanOperation } from '@/lib/portfolio/portfolio';

export function saleFormSchema(
  bond: Bond,
  operations: PlanOperation[],
  planId: string,
  today: string,
  id = 'draft-sale',
) {
  return purchaseFormSchema(bond, 'sale')
    .refine((values) => values.date <= today, {
      path: ['date'],
      error: 'Продаж не може бути в майбутньому',
    })
    .superRefine((values, context) => {
      const error = operationHistoryError([
        ...operations.filter((operation) => operation.id !== id),
        {
          ...values,
          id,
          planId,
          type: 'sale',
          ovdp: bond,
          isin: bond.isin,
          currency: bond.currency,
        },
      ]);
      if (error) context.addIssue({ code: 'custom', path: ['quantity'], message: error });
    });
}

export type SaleFormInput = z.input<ReturnType<typeof saleFormSchema>>;
export type SaleFormValues = z.output<ReturnType<typeof saleFormSchema>>;
