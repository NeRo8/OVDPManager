import type { Bond } from '@/entities/portfolio';

import { purchaseFormSchema } from '../purchaseForm.schema';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 15,
  issueDate: '2025-01-01',
  maturityDate: '2028-01-01',
  description: '',
  payments: [],
};

it('rejects fractional and punctuation-separated quantities without changing their value', () => {
  const schema = purchaseFormSchema(bond);
  for (const quantity of ['1,5', '1.5', '1.000']) {
    expect(schema.safeParse({ purchaseDate: '2026-01-01', quantity, amount: '1000' }).success).toBe(
      false,
    );
  }
  expect(
    schema.parse({ purchaseDate: '2026-01-01', quantity: '15', amount: '1000' }).quantity,
  ).toBe(15);
});

it('asks for an unambiguous purchase amount instead of interpreting a thousands separator as decimals', () => {
  const schema = purchaseFormSchema(bond);
  const input = { purchaseDate: '2026-01-01', quantity: '1' };
  expect(schema.safeParse({ ...input, amount: '1.000' }).success).toBe(false);
  expect(schema.safeParse({ ...input, amount: '1,000' }).success).toBe(false);
  expect(schema.parse({ ...input, amount: '1 000' }).amount).toBe(1000);
  expect(schema.parse({ ...input, amount: '1,50' }).amount).toBe(1.5);
});
