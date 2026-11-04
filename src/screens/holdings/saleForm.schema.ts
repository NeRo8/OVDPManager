import { z } from 'zod';

import { purchaseFormSchema } from '@/lib/add-purchase/purchaseForm.schema';
import { operationHistoryError } from '@/lib/portfolio/operations';
import { type Bond, type PlanOperation, plannedByDate } from '@/lib/portfolio/portfolio';

export function saleFormSchema(
  bond: Bond,
  operations: PlanOperation[],
  planId: string,
  today: string,
  id = 'draft-sale',
) {
  // A sale may be dated ahead: it is planned until confirmed, and the history must allow it then.
  return purchaseFormSchema(bond, 'sale').superRefine((values, context) => {
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
        planned: plannedByDate(values.date, today),
      },
    ]);
    if (error) context.addIssue({ code: 'custom', path: ['quantity'], message: error });
  });
}

export type SaleFormInput = z.input<ReturnType<typeof saleFormSchema>>;
export type SaleFormValues = z.output<ReturnType<typeof saleFormSchema>>;
