import { z } from 'zod';

import { migratePurchases, withPlannedFlags } from '@/lib/portfolio/migrateOperations';
import { operationHistoryError, refreshOperationBonds } from '@/lib/portfolio/operations';
import { BOND_KINDS, CURRENCIES } from '@/lib/portfolio/portfolio';
import { todayISO } from '@/utils/date';

const id = z.string().trim().min(1);
const money = z.number().nonnegative().max(Number.MAX_SAFE_INTEGER);
const currency = z.enum(CURRENCIES);
const payment = z.object({
  date: z.iso.date(),
  type: z.enum(['coupon', 'redemption']),
  amount: money,
});
const bond = z
  .object({
    isin: id,
    kind: z.enum(BOND_KINDS).optional(),
    nominal: money.positive(),
    rate: money,
    currency,
    issueDate: z.iso.date(),
    maturityDate: z.iso.date(),
    description: z.string(),
    payments: z.array(payment),
  })
  .refine(
    (value) =>
      value.issueDate < value.maturityDate &&
      value.payments.every(
        (item) => item.date >= value.issueDate && item.date <= value.maturityDate,
      ),
    { error: 'Некоректні дати ОВДП' },
  )
  .refine(
    (value) =>
      new Set(value.payments.map((item) => `${item.date}:${item.type}`)).size ===
      value.payments.length,
    { error: 'Повторні виплати ОВДП' },
  );
const common = {
  id,
  planId: id,
  isin: id,
  amount: money.positive(),
  quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency,
};
const operation = z
  .object({
    ...common,
    type: z.enum(['purchase', 'sale']),
    date: z.iso.date(),
    ovdp: bond.nullable(),
    // Files written before confirmation existed have none; `validateContents` fills it in.
    planned: z.boolean().optional(),
  })
  .refine(
    (value) =>
      !value.ovdp ||
      (value.ovdp.isin === value.isin &&
        value.ovdp.currency === value.currency &&
        value.date >= value.ovdp.issueDate &&
        value.date < value.ovdp.maturityDate),
    { error: 'Операція не відповідає ОВДП' },
  )
  .refine((value) => value.type !== 'sale' || value.ovdp !== null, {
    error: 'Продаж без даних ОВДП',
  });
const framing = {
  activePlanId: id.optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  plans: z.array(z.object({ id, name: id })),
};
export const legacyContentsSchema = z
  .object({
    ...framing,
    holdings: z.array(z.object({ ...common, purchaseDate: z.iso.date() })),
  })
  .transform(({ holdings, ...rest }) => ({
    ...rest,
    operations: migratePurchases(holdings, [], todayISO()),
  }));

export const contentsSchema = z.object({ ...framing, operations: z.array(operation) });

/** Validate cross-record invariants before any store is replaced. */
export function validateContents(contents: z.output<typeof contentsSchema>) {
  const { plans, activePlanId } = contents;
  const today = todayISO();
  const operations = withPlannedFlags(contents.operations, today);
  if (!plans.length) throw new Error('У копії немає жодного плану');
  const planIds = new Set(plans.map((plan) => plan.id));
  if (activePlanId && !planIds.has(activePlanId)) throw new Error('Активного плану немає в копії');
  if (
    planIds.size !== plans.length ||
    new Set(operations.map((item) => item.id)).size !== operations.length
  )
    throw new Error('Копія містить повторні ідентифікатори');
  const currencies = new Map<string, string>();
  operations.forEach((item, index) => {
    if (!planIds.has(item.planId))
      throw new Error(`Операція №${index + 1}: її плану немає в копії`);
    if (currencies.has(item.isin) && currencies.get(item.isin) !== item.currency)
      throw new Error('Різні валюти одного ISIN');
    currencies.set(item.isin, item.currency);
  });
  const error = operationHistoryError(operations);
  if (error) throw new Error(error);
  return refreshOperationBonds(operations, [], today);
}
