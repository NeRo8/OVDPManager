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
  planned: false,
  isin: 'UA1',
  currency: 'UAH',
  date: '2025-02-01',
  quantity: 10,
  amount: 10000,
};
const schema = saleFormSchema(bond, [purchase], 'p', '2026-01-01');

describe('saleForm.schema', () => {
  it('accepts a partial sale with the full net amount and rejects an impossible date or quantity', () => {
    const values = { date: '2025-07-01', quantity: '4', amount: '4 100,50' };
    expect(schema.parse(values)).toEqual({ date: values.date, quantity: 4, amount: 4100.5 });
    for (const change of [{ quantity: '11' }, { date: '2025-01-15' }, { amount: '0' }]) {
      expect(schema.safeParse({ ...values, ...change }).success).toBe(false);
    }
  });

  it('accepts a sale dated ahead, planned until confirmed, as long as the bonds are there', () => {
    expect(schema.safeParse({ date: '2026-06-01', quantity: '10', amount: '10500' }).success).toBe(
      true,
    );
    // A planned purchase counts for a planned sale after it, as the plan is one scenario.
    const planned = { ...purchase, id: 'later', date: '2026-03-01', planned: true };
    const withPlanned = saleFormSchema(bond, [purchase, planned], 'p', '2026-01-01');
    expect(withPlanned.safeParse({ date: '2026-06-01', quantity: '20', amount: '1' }).success).toBe(
      true,
    );
    expect(withPlanned.safeParse({ date: '2026-02-01', quantity: '20', amount: '1' }).success).toBe(
      false,
    );
  });
});
