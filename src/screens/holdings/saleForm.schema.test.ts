import type { Bond, PlanOperation } from '@/lib/portfolio/portfolio';

import { saleFormSchema } from './saleForm.schema';

const bond: Bond = {
  isin: 'UA1',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [],
};
const purchase: PlanOperation = {
  id: 'buy',
  planId: 'p',
  type: 'purchase',
  ovdp: bond,
  isin: 'UA1',
  currency: 'UAH',
  date: '2025-02-01',
  quantity: 10,
  amount: 10000,
};
const schema = saleFormSchema(bond, [purchase], 'p', '2026-01-01');

it('accepts a partial sale with the full net amount and rejects an impossible date or quantity', () => {
  const values = { date: '2025-07-01', quantity: '4', amount: '4 100,50' };
  expect(schema.parse(values)).toEqual({ date: values.date, quantity: 4, amount: 4100.5 });
  for (const change of [
    { quantity: '11' },
    { date: '2025-01-15' },
    { date: '2026-01-02' },
    { amount: '0' },
  ]) {
    expect(schema.safeParse({ ...values, ...change }).success).toBe(false);
  }
});
